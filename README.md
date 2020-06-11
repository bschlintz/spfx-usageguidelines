## Usage Guidelines Pop-up

Require site users to accept usage guidelines in order to use a SharePoint site collection. The usage guideline configuration and responses are maintained within SharePoint lists.

## Setup Instructions
### Pre-requisites
- App Catalog: Ensure the [App Catalog](https://docs.microsoft.com/en-us/sharepoint/use-app-catalog) is setup in your SharePoint Online tenant

### Solution Installation
1. Download the SPFx package [site-usage-guidelines.sppkg](https://github.com/bschlintz/spfx-usageguidelines/blob/master/sharepoint/solution/site-usage-guidelines.sppkg) file from Github (or clone the repo and build the package yourself)
    > __Tip__: Click on the link, then click Download. On Windows, you may need to unblock the file after downloading otherwise the package will be corrupt when uploading to SharePoint. To verify, right-click on the .sppkg file, then click Properties, then look for an 'Unblock' checkbox at the bottom. Tick the box and click OK. If you don't see the checkbox, then no action is required.
2. Upload sppkg file to the 'Apps for SharePoint' library in your Tenant App Catalog
3. Click Deploy

### Solution Updates
Follow the same steps as installation. Overwrite the existing package in the 'Apps for SharePoint' library when uploading the new package. 

> __Tip__: Be sure to check-in the sppkg file after the deployment if it is left checked-out.

### Site Installation
1. Navigate to the SharePoint site collection where you want to enable this functionality.
2. From the page command bar 'New' drop-down or settings gear, click 'Add an App'.
3. Click 'Site Usage Guidelines' from the 'Apps you can add' section to install the app within your site. This step creates two lists: `UsageGuidelinesConfig` and `UsageGuidelinesTracking`.
4. Navigate to the `UsageGuidelinesTracking` list settings. Break the list permissions to stop inheriting the from site. Configure the list permissions to allow the site visitors group the ability to add items to the list.
    > __Security Tip__: Create a new site permission level called 'Add Items Only'. Assign this permission level to the site visitors group on the `UsageGuidelinesTracking` list.
5. While in the `UsageGuidelinesTracking` list settings, click on 'Advanced Settings'. Set `Read access` to `Read items that were created by the user` and `Create and Edit access` to `Create items and edit items that were created by the user`. These two settings will prevent users from seeing other user acknowledgements if they were to navigate directly to this list.
6. Navigate to the `UsageGuidelinesConfig` list. Update the default list item to configure the usage guidelines message, version, header text. Once finished, set the item's `Enabled` field to true. This will begin prompting site users to acknowledge the usage guidelines.

## Technical Details
The solution will cache 'Accepted' responses in the user's browser using [local storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) for 30 days. If the usage guidelines change during this time, the user will not be prompted to acknowledge the guidelines again until 30 days pass and 1) the message version changes 2) or the user's tracking list item is deleted. See [UsageGuidelinesService.ts](https://github.com/bschlintz/spfx-usageguidelines/blob/master/src/services/UsageGuidelinesService.ts).
