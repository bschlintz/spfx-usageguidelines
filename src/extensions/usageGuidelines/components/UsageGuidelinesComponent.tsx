import * as React from 'react';
import { useState } from 'react';
import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { UsageGuidelinesService, UsageGuidelinesConfig } from '../../../services/UsageGuidelinesService';
import * as strings from 'UsageGuidelinesApplicationCustomizerStrings';
import { Log } from '@microsoft/sp-core-library';
import { LOG_SOURCE } from '../UsageGuidelinesApplicationCustomizer';

export type UsageGuidelinesProps = {
  service: UsageGuidelinesService;
  config: UsageGuidelinesConfig;
};

export const UsageGuidelinesComponent: React.FC<UsageGuidelinesProps> = ({ service, config }) => {
  const [ isVisible, setVisible ] = useState<boolean>(true);
  const [ isSubmitting, setSubmitting ] = useState<boolean>(false);

  const onAccept = async () => {
    Log.info(LOG_SOURCE, `User accepted usage guidelines version ${config.version}`);
    setSubmitting(true);
    await service.setUserAccepted(config.version);
    setVisible(false);
  };

  const onDecline = () => {
    Log.info(LOG_SOURCE, `User declined usage guidelines version ${config.version}. Redirecting to ${config.declineRedirectUrl}`);
    // Redirect user
    window.location.assign(config.declineRedirectUrl);
  };

  return <>
    <Dialog
      hidden={!isVisible}
      minWidth={600}
      dialogContentProps={{
        type: DialogType.normal,
        title: config.header,
      }}
      modalProps={{
        isBlocking: true,
        isDarkOverlay: true,
      }}
    >
      <Stack>
        <div dangerouslySetInnerHTML={{__html: config.message }} />
      </Stack>
      <DialogFooter>
        <PrimaryButton onClick={onAccept} text={!isSubmitting && strings.AcceptLabel} disabled={isSubmitting}>
          {isSubmitting && <Spinner size={SpinnerSize.small} />}
        </PrimaryButton>
        <DefaultButton onClick={onDecline} text={strings.DeclineLabel} disabled={isSubmitting} />
      </DialogFooter>
    </Dialog>
  </>;
};
