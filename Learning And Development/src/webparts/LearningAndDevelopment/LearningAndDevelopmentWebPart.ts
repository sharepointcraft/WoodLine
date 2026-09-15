import * as React from 'react';
import * as ReactDom from 'react-dom';
import { DisplayMode, Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'learningAndDevelopmentWebPartStrings';
import LearningAndDevelopment from './components/LearningAndDevelopment';
import { ILearningAndDevelopmentProps } from './components/ILearningAndDevelopmentProps';

export interface ILearningAndDevelopmentWebPartProps {
  title: string;
  description: string;
  libraryTitle: string;
  resourcesAndDocumentsListName: string;
  upcomingEventsListName: string;
  useMockData: boolean;
  videoExtensions: string;
}

export default class LearningAndDevelopmentWebPart extends BaseClientSideWebPart<ILearningAndDevelopmentWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    this.updateSharePointChrome();

    const element: React.ReactElement<ILearningAndDevelopmentProps> = React.createElement(
      LearningAndDevelopment,
      {
        title: this.properties.title !== undefined ? this.properties.title : 'Learning & Development Center',
        description: this.properties.description !== undefined && this.properties.description !== ''
          ? this.properties.description
          : 'Build knowledge, sharpen skills, and access the training, insights, and resources that support your development at Woodline.',
        libraryTitle: this.properties.libraryTitle !== undefined ? this.properties.libraryTitle : '',
        resourcesAndDocumentsListName: this.properties.resourcesAndDocumentsListName !== undefined ? this.properties.resourcesAndDocumentsListName : '',
        upcomingEventsListName: this.properties.upcomingEventsListName !== undefined ? this.properties.upcomingEventsListName : '',
        useMockData: this.properties.useMockData !== undefined ? this.properties.useMockData : false,
        videoExtensions: this.properties.videoExtensions || 'mp4,mov,wmv,avi,webm,mkv,m4v',
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        userDisplayName: this.context.pageContext?.user?.displayName || 'User',
        context: this.context
      }
    );

    ReactDom.render(element, this.domElement);
  }

  private updateSharePointChrome(): void {
    const styleId = 'woodline-hide-sharepoint-chrome';
    let style = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    style.innerHTML = `
      /* Hide Page Command Bar & specific command bar buttons */
      [data-automation-id="pageCommandBar"],
      [data-automation-id="PageCommandBar"],
      [class*="pageCommandBar"],
      [class*="PageCommandBar"],
      #spPageCanvasContent [class*="commandBar"],
      #workbenchPageContent [class*="commandBar"],
      [data-automation-id="pageCommandBarNewButton"],
      [data-automation-id="promoteButton"],
      [data-automation-id="pageSettingsButton"],
      [data-automation-id="previewButton"],
      [data-automation-id="analyticsButton"],
      [data-automation-id*="pageCommandBarNewButton"],
      [data-automation-id*="promoteButton"],
      [data-automation-id*="pageSettingsButton"],
      [data-automation-id*="previewButton"],
      [data-automation-id*="analyticsButton"] {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        min-height: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: hidden !important;
      }

      /* Hide Page Social Bar (Like, Views, Add to favorites) */
      [data-automation-id="pageSocialBar"],
      [data-automation-id="socialBar"],
      [class*="socialBar"],
      [class*="pageSocialBar"],
      [class*="socialBarContainer"] {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        min-height: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: hidden !important;
      }

      /* Hide Page Comments Wrapper (id="vpc_Page.CommentsWrapper.internal...") */
      [id*="CommentsWrapper"],
      [id*="Page.CommentsWrapper"],
      [id^="vpc_Page.CommentsWrapper"],
      [data-automation-id="commentsWrapper"],
      [class*="commentsWrapper"],
      [class*="CommentsWrapper"] {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        min-height: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: hidden !important;
      }
    `;
  }

  protected onDisplayModeChanged(oldDisplayMode: DisplayMode): void {
    this.updateSharePointChrome();
    this.render();
  }

  protected onInit(): Promise<void> {
    return this._getEnvironmentMessage().then(message => {
      this._environmentMessage = message;
    });
  }

  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) {
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams':
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }
          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const { semanticColors } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }
  }

  protected onDispose(): void {
    const style = document.getElementById(
      'woodline-hide-sharepoint-chrome'
    );
    style?.remove();
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('title', {
                  label: 'Hero Section Title',
                  description: 'Title text displayed in the top hero section'
                }),
                PropertyPaneTextField('description', {
                  label: 'Hero Section Description',
                  multiline: true,
                  rows: 3,
                  description: 'Description paragraph text displayed in the top hero section'
                }),
                PropertyPaneTextField('libraryTitle', {
                  label: 'Document Library Title',
                  description: 'Name of the SharePoint document library containing learning folders'
                }),
                PropertyPaneTextField('resourcesAndDocumentsListName', {
                  label: 'Resources & Documents List Name',
                  description: 'Name of the SharePoint list for Resources & Documents'
                }),
                PropertyPaneTextField('upcomingEventsListName', {
                  label: 'Upcoming Events List Name',
                  description: 'Name of the SharePoint list for Upcoming Events'
                }),
                // PropertyPaneToggle('useMockData', {
                //   label: 'Use Demo Data',
                //   onText: 'Enabled (Demo Mode)',
                //   offText: 'Disabled (Live SharePoint Data)'
                // }),
                PropertyPaneTextField('videoExtensions', {
                  label: 'Video File Extensions',
                  description: 'Comma-separated video file extensions to display'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
