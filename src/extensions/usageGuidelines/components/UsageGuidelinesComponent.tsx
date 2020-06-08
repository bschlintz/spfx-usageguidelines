import * as React from 'react';
import { useState } from 'react';
import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { UsageGuidelinesService, UsageGuidelinesConfig, AcknowledgeAction } from '../../../services/UsageGuidelinesService';
import * as strings from 'UsageGuidelinesApplicationCustomizerStrings';
import { Log } from '@microsoft/sp-core-library';
import { LOG_SOURCE } from '../UsageGuidelinesApplicationCustomizer';

export type UsageGuidelinesProps = {
  service: UsageGuidelinesService;
  config: UsageGuidelinesConfig;
};

export const UsageGuidelinesComponent: React.FC<UsageGuidelinesProps> = ({ service, config }) => {
  const [ isVisible, setVisible ] = useState<boolean>(true);
  const [ isAccepting, setAccepting ] = useState<boolean>(false);
  const [ isDeclining, setDeclining ] = useState<boolean>(false);

  const onAccept = async () => {
    Log.info(LOG_SOURCE, `User accepted usage guidelines version ${config.version}`);
    setAccepting(true);
    await service.setAcknowledgement(AcknowledgeAction.Accepted, config.version);
    setVisible(false);
  };

  const onDecline = async () => {
    Log.info(LOG_SOURCE, `User declined usage guidelines version ${config.version}. Redirecting to ${config.declineRedirectUrl}`);
    setDeclining(true);
    await service.setAcknowledgement(AcknowledgeAction.Declined, config.version);
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
        <Stack tokens={{childrenGap: 10}}>
          <div dangerouslySetInnerHTML={{__html: config.message }} />
          <div>{`${strings.LastUpdatedLabel}: ${config.lastUpdated}`}</div>
        </Stack>
      </Stack>
      <DialogFooter>
        <PrimaryButton
          onClick={onAccept}
          text={!isAccepting && strings.AcceptLabel}
          disabled={isAccepting || isDeclining}
          style={{ width: 120 }}
        >
          {isAccepting && <Spinner size={SpinnerSize.small} />}
        </PrimaryButton>
        <DefaultButton
          onClick={onDecline}
          text={!isDeclining && strings.DeclineLabel}
          disabled={isAccepting || isDeclining}
          style={{ width: 120 }}
        >
          {isDeclining && <Spinner size={SpinnerSize.small} />}
        </DefaultButton>
      </DialogFooter>
    </Dialog>
  </>;
};
