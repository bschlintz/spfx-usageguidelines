import { BaseComponentContext } from '@microsoft/sp-component-base';
import { SPHttpClient } from '@microsoft/sp-http';

export type UsageGuidelinesMessage = {
  message: string;
  version: string;
}

export type UsageGuidelinesConfig = {
  header: string;
  message: string;
  version: string;
  declineRedirectUrl: string;
}

export type UsageGuidelinesResponse = {

}

export class UsageGuidelinesService {
  private _context: BaseComponentContext;

  constructor(context: BaseComponentContext) {
    this._context = context;
  }

  public getConfiguration = async (): Promise<UsageGuidelinesConfig> => {
    let apiUrl = `/_api/lists/getbytitle('UsageGuidelinesConfig')/items?$top=1`;
    const result = await this._context.spHttpClient.get(`${this._context.pageContext.site.serverRelativeUrl}${apiUrl}`, SPHttpClient.configurations.v1);

    if (result.ok) {
      const data = await result.json();
      const item = data && data.value && data.value.length > 0 ? data.value[0] : null;
      if (item) {
        return {
          header: item['Header'],
          message: item['Message'],
          version: item['MessageVersion'],
          declineRedirectUrl: item['DeclineRedirectUrl'],
        } as UsageGuidelinesConfig;
      }
    }
    throw new Error(`Failed to fetch Usage Guidelines Config. [${result.status}] ${result.statusText}`);
  }

  public getUserAcceptance = async (): Promise<boolean> => {
    const result = await this._context.spHttpClient.get(`${this._context.pageContext.site.serverRelativeUrl}/_api/web`, SPHttpClient.configurations.v1);
    return false;
  }

  public setUserAccepted = async (version: string): Promise<void> => {
    console.log(`[UsageGuidelinesService] User accepted version ${version}`);
  }

  public getUsageMessage = async (): Promise<UsageGuidelinesMessage> => {
    const result = await this._context.spHttpClient.get(`${this._context.pageContext.site.serverRelativeUrl}/_api/web`, SPHttpClient.configurations.v1);

    return {
      message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      version: "v0.1"
    };
  }

}
