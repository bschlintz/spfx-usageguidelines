import { BaseComponentContext } from '@microsoft/sp-component-base';
import { Log } from '@microsoft/sp-core-library';
import { sp } from "@pnp/sp";
import { PnPClientStorage } from "@pnp/common";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/common";
import { LOG_SOURCE } from '../extensions/usageGuidelines/UsageGuidelinesApplicationCustomizer';
import endOfMonth from 'date-fns/endOfMonth';
import addMinutes from 'date-fns/addMinutes';

const NOW = new Date();
const BROWSER_CACHE_EXPIRATION_CONFIG = addMinutes(NOW, 1); // 1 minute
const BROWSER_CACHE_EXPIRATION_TRACKING = endOfMonth(NOW); // End of the current month

const LIST_NAME_TRACKING = "UsageGuidelinesTracking";
const LIST_NAME_CONFIG = "UsageGuidelinesConfig";

export type UsageGuidelinesConfig = {
  header: string;
  message: string;
  version: string;
  lastUpdated: string;
  declineRedirectUrl: string;
};

export type AcknowledgementCache = {
  action: AcknowledgeAction;
  version: string;
};

export enum AcknowledgeAction {
  Accepted = "Accepted",
  Declined = "Declined",
}

export class UsageGuidelinesService {
  private _context: BaseComponentContext;
  private _storage: PnPClientStorage;

  constructor(context: BaseComponentContext) {
    this._context = context;
    this._storage = new PnPClientStorage();

    sp.setup(context);
  }

  private _makeCacheKey = (listName: string) => `${listName}_${this._context.pageContext.site.id.toString()}`;

  private _clearCache = (): void => {
    this._storage.local.delete(this._makeCacheKey(LIST_NAME_CONFIG));
    this._storage.local.delete(this._makeCacheKey(LIST_NAME_TRACKING));
  }

  private _cacheConfig = (config: UsageGuidelinesConfig): void => {
    const cacheKey: string = this._makeCacheKey(LIST_NAME_CONFIG);
    this._storage.local.put(cacheKey, config, BROWSER_CACHE_EXPIRATION_CONFIG);
  }

  private _cacheAcknowledgement = (action: AcknowledgeAction, version: string): void => {
    const cacheKey: string = this._makeCacheKey(LIST_NAME_TRACKING);
    const cacheValue: AcknowledgementCache = { action, version };
    this._storage.local.put(cacheKey, cacheValue, BROWSER_CACHE_EXPIRATION_TRACKING);
  }

  private _fetchConfig = async (): Promise<UsageGuidelinesConfig> => {
    // Fetch configuration
    const result = await sp.web.lists.getByTitle(LIST_NAME_CONFIG).items.top(1)
                          .filter(`Enabled eq 1`).orderBy('MessageVersion', false).get();

    if (!result || result.length === 0) {
      Log.warn(LOG_SOURCE, `No enabled usage guidelines configuration item(s) found.`);
      return null;
    }
    const item = result[0];

    const config: UsageGuidelinesConfig = {
      header: item['Header'],
      message: item['Message'],
      version: item['MessageVersion'],
      lastUpdated: new Date(item['Modified']).toLocaleDateString(),
      declineRedirectUrl: item['DeclineRedirectUrl'],
    };
    this._cacheConfig(config);

    return config;
  }

  private _fetchLatestAcknowledgement = async (version?: string): Promise<boolean | null> => {
    // Fetch user acknowledgement
    let filters = [`AcknowledgedBy/Id eq ${this._context.pageContext.legacyPageContext.userId}`];
    if (version) {
      filters.push(`AcknowledgedVersion eq '${version}'`);
    }
    const result = await sp.web.lists.getByTitle(LIST_NAME_TRACKING).items.filter(filters.join(' and '))
      .expand('AcknowledgedBy').select('AcknowledgedBy/Id', 'AcknowledgedVersion', 'Action')
      .orderBy('AcknowledgedOn', false)
      .top(1).get();

    const item = result && result.length > 0 ? result[0] : null;
    let hasAccepted = null;

    if (item) {
      hasAccepted = item['Action'] === AcknowledgeAction.Accepted;
      if (hasAccepted) {
        this._cacheAcknowledgement(item['Action'], item['AcknowledgedVersion']);
      }
    }

    return hasAccepted;
  }

  public getAcknowledgement = async (): Promise<boolean | null> => {
    try {
      const cacheKey: string = this._makeCacheKey(LIST_NAME_TRACKING);
      const fromCache: AcknowledgementCache = this._storage.local.get(cacheKey);
      let hasAccepted: boolean = null;

      // Do we have something in cache?
      if (fromCache) {
        hasAccepted = fromCache.action === AcknowledgeAction.Accepted;
      }
      // No cache, fetch latest message version config and tracking item
      else {
        const config = await this._fetchConfig();
        hasAccepted = await this._fetchLatestAcknowledgement(config.version);
      }

      return hasAccepted;
    }
    catch (error) {
      Log.error(LOG_SOURCE, error);
    }
  }

  public getConfig = async (): Promise<UsageGuidelinesConfig> => {
    try {
      const cacheKey: string = this._makeCacheKey(LIST_NAME_CONFIG);
      const fromCache: UsageGuidelinesConfig = this._storage.local.get(cacheKey);

      if (!fromCache) {
        return await this._fetchConfig();
      }
      else return fromCache;
    }
    catch(error) {
      Log.error(LOG_SOURCE, error);
    }
  }

  public setAcknowledgement = async (action: AcknowledgeAction, version: string): Promise<void> => {
    try {
      // Record in tracking list
      await sp.web.lists.getByTitle(LIST_NAME_TRACKING).items.add({
        Title: `${action} by ${this._context.pageContext.user.displayName}`,
        Action: action,
        AcknowledgedVersion: version,
        AcknowledgedById: this._context.pageContext.legacyPageContext.userId,
      });

      // If accepted, save in browser cache
      if (action === AcknowledgeAction.Accepted) {
        this._cacheAcknowledgement(action, version);
      }
    }
    catch (error) {
      Log.error(LOG_SOURCE, error);
    }
  }

}
