import * as React from 'react';
import { useState, useEffect } from 'react';
import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Stack, StackItem } from 'office-ui-fabric-react/lib/Stack';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { UsageGuidelinesService, UsageGuidelinesConfig } from '../../../services/UsageGuidelinesService';

export type UsageGuidelinesProps = {
  service: UsageGuidelinesService;
  declineRedirectUrl: string;
}

export const UsageGuidelinesComponent: React.FC<UsageGuidelinesProps> = ({ service }) => {
  console.log(`[UsageGuidelinesComponent]`);
  const [ isVisible, setVisible ] = useState<boolean>(true);
  const [ isLoading, setLoading ] = useState<boolean>(true);
  const [ config, setConfig ] = useState<UsageGuidelinesConfig>(null);
  const [ error, setError ] = useState<Error>(null);

  useEffect(() => {
    service.getConfiguration()
      .then(result => { setConfig(result); setLoading(false); })
      .catch(error => { setError(error); setLoading(false); });
  }, []);

  const onAccept = async () => {
    await service.setUserAccepted(config.version);
    setVisible(false);
  }

  const onDecline = () => {
    //goodbye
    window.location.assign(config.declineRedirectUrl);
  }

  const renderUsageGuidelines = () => (
    <>
      <Stack>
        <div dangerouslySetInnerHTML={{__html: config.message }} />
      </Stack>
      <DialogFooter>
        <PrimaryButton onClick={onAccept} text="Accept" />
        <DefaultButton onClick={onDecline} text="Decline" />
      </DialogFooter>
    </>
  )

  const renderLoading = () => (
    <Stack horizontalAlign="center" verticalAlign="center">
      <Spinner size={SpinnerSize.large} />
    </Stack>
  )

  const renderError = () => (
    <Stack>
      <StackItem>
        {error}
      </StackItem>
    </Stack>
  )

  return <>
      <Dialog
        hidden={!isVisible}
        minWidth={600}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Site Usage Guidelines',
        }}
        modalProps={{
          isBlocking: true,
          isDarkOverlay: true,
        }}
      >
        { !error ? !isLoading ? renderUsageGuidelines() : renderLoading() : renderError() }
      </Dialog>
  </>;
}
