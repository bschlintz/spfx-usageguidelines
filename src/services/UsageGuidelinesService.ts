import { BaseComponentContext } from '@microsoft/sp-component-base';
import { Log } from '@microsoft/sp-core-library';
import { sp } from "@pnp/sp";
import { PnPClientStorage } from "@pnp/common";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/common";
import { LOG_SOURCE } from '../extensions/usageGuidelines/UsageGuidelinesApplicationCustomizer';

export type UsageGuidelinesConfig = {
  header: string;
  message: string;
  version: string;
  declineRedirectUrl: string;
  userHasAcceptedCurrentVersion?: boolean;
};

const LIST_TRACKING = "UsageGuidelinesTracking";
const LIST_CONFIG = "UsageGuidelinesConfig";

export class UsageGuidelinesService {
  private _context: BaseComponentContext;
  private _storage: PnPClientStorage;
  private _cacheExpiration: Date;

  constructor(context: BaseComponentContext) {
    this._context = context;
    this._storage = new PnPClientStorage();
    this._cacheExpiration = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // Now + 30 Days

    sp.setup(context);
  }

  private _makeCacheKey = (listName: string) => `${listName}_${this._context.pageContext.site.id.toString()}`;

  private _clearCache = (): void => {
    this._storage.local.delete(this._makeCacheKey(LIST_CONFIG));
    this._storage.local.delete(this._makeCacheKey(LIST_TRACKING));
  }

  private _getConfig = async (): Promise<UsageGuidelinesConfig> => {
    const cacheKey = this._makeCacheKey(LIST_CONFIG);
    const fromCache = this._storage.local.get(cacheKey);

    if (!fromCache) {
      // Query for Acceptance Guidelines configuration
      const configResult = await sp.web.lists.getByTitle(LIST_CONFIG).items.top(1)
                                      .filter(`Enabled eq 1`).orderBy('MessageVersion', false).get();

      if (!configResult || configResult.length === 0) {
        Log.warn(LOG_SOURCE, `No enabled usage guidelines configuration items found.`);
        return null;
      }
      const configItem = configResult[0];

      const config: UsageGuidelinesConfig = {
        header: configItem['Header'],
        message: configItem['Message'],
        version: configItem['MessageVersion'],
        declineRedirectUrl: configItem['DeclineRedirectUrl'],
      };
      this._storage.local.put(cacheKey, config, this._cacheExpiration);
      return config;
    }
    else return fromCache;
  }

  private _getUserAcceptanceForVersion = async (version: string): Promise<boolean> => {
    const cacheKey = this._makeCacheKey(LIST_TRACKING);
    const fromCache = this._storage.local.get(cacheKey);

    if (!fromCache || false === fromCache.accepted || fromCache.version !== version) {

      // Query for User Acceptance of current version
      const userAcceptanceResult = await sp.web.lists.getByTitle(LIST_TRACKING).items.filter([
        `AcceptedBy/Id eq ${this._context.pageContext.legacyPageContext.userId}`,
        `AcceptedMessageVersion eq '${version}'`
      ].join(' and ')).expand('AcceptedBy').select('AcceptedBy/Id', 'AcceptedMessageVersion')
      .orderBy('AcceptedMessageVersion', false).top(1).get();

      const userHasAcceptedCurrentVersion = userAcceptanceResult && userAcceptanceResult.length > 0;
      this._storage.local.put(cacheKey, { accepted: userHasAcceptedCurrentVersion, version }, this._cacheExpiration);

      return userHasAcceptedCurrentVersion;
    }
    else return fromCache.accepted;
  }

  public getUserAcceptance = async (): Promise<UsageGuidelinesConfig> => {
    try {
      let config = await this._getConfig();
      if (config) {
        config.userHasAcceptedCurrentVersion = await this._getUserAcceptanceForVersion(config.version);
      }
      return config;
    }
    catch(error) {
      Log.error(LOG_SOURCE, error);
    }
  }

  public setUserAccepted = async (version: string): Promise<void> => {
    try {
      await sp.web.lists.getByTitle(LIST_TRACKING).items.add({
        Title: `Accepted by ${this._context.pageContext.user.displayName}`,
        AcceptedMessageVersion: version,
        AcceptedById: this._context.pageContext.legacyPageContext.userId,
      });
      this._clearCache(); // clear cache after saving acceptance
      await this.getUserAcceptance(); // re-fetch to establish cache
    }
    catch (error) {
      Log.error(LOG_SOURCE, error);
    }
  }

}
