import * as React from 'react';
import * as ReactDom from 'react-dom';
import { override } from '@microsoft/decorators';
import { Log } from '@microsoft/sp-core-library';
import {
  BaseApplicationCustomizer, PlaceholderContent, PlaceholderName
} from '@microsoft/sp-application-base';

import { UsageGuidelinesService, UsageGuidelinesConfig } from '../../services/UsageGuidelinesService';
import { UsageGuidelinesComponent } from './components/UsageGuidelinesComponent';

export const LOG_SOURCE: string = 'UsageGuidelines';

export interface IUsageGuidelinesApplicationCustomizerProperties {}

/** A Custom Action which can be run during execution of a Client Side Application */
export default class UsageGuidelinesApplicationCustomizer
  extends BaseApplicationCustomizer<IUsageGuidelinesApplicationCustomizerProperties> {

  private _topPlaceholder: PlaceholderContent;
  private _service: UsageGuidelinesService;

  @override
  public async onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized Usage Guidelines Extension`);

    if (!this._service) {
      this._service = new UsageGuidelinesService(this.context);
    }

    //Event handler to execute on each page navigation
    this.context.application.navigatedEvent.add(this, this.onNavigated);
  }

  private async onNavigated(): Promise<void> {
    const config = await this._service.getUserAcceptance();
    Log.verbose(LOG_SOURCE, JSON.stringify(config));

    if (config && !config.userHasAcceptedCurrentVersion) {
      Log.info(LOG_SOURCE, `Displaying Usage Guidelines`);
      this.renderUsageGuidelines(config);
    }
  }

  private renderUsageGuidelines(config: UsageGuidelinesConfig): void {
    if (!this._topPlaceholder) {
      this._topPlaceholder = this.context.placeholderProvider.tryCreateContent(PlaceholderName.Top);

      if (!this._topPlaceholder) {
        Log.error(LOG_SOURCE, new Error(`Unable to render Top placeholder`));
        return;
      }
    }

    //Render React Usage Guidelines Component
    const bannerComponent = React.createElement(UsageGuidelinesComponent, {
      service: this._service,
      config
    });
    ReactDom.render(bannerComponent, this._topPlaceholder.domElement);
  }
}
