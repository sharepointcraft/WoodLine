import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'learningAndDevelopmentWebPartStrings';
import LearningAndDevelopment from './components/LearningAndDevelopment';
import { ILearningAndDevelopmentProps } from './components/ILearningAndDevelopmentProps';

export interface ILearningAndDevelopmentWebPartProps {
  description: string;
  libraryTitle: string;
  quickLinksListName: string;
  upcomingEventsListName: string;
  useMockData: boolean;
  videoExtensions: string;
}

export default class LearningAndDevelopmentWebPart extends BaseClientSideWebPart<ILearningAndDevelopmentWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    const element: React.ReactElement<ILearningAndDevelopmentProps> = React.createElement(
      LearningAndDevelopment,
      {
        description: this.properties.description || 'Learning & Development Video Portal',
        libraryTitle: this.properties.libraryTitle || 'Documents',
        quickLinksListName: this.properties.quickLinksListName || '',
        upcomingEventsListName: this.properties.upcomingEventsListName || '',
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
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                }),
                PropertyPaneTextField('libraryTitle', {
                  label: 'Document Library Title',
                  description: 'Name of the SharePoint document library containing learning folders (default: Documents)'
                }),
                PropertyPaneTextField('quickLinksListName', {
                  label: 'Quick Links List Name',
                  description: 'Name of the SharePoint list for Resources & Quick Links (default: QuickLinks)'
                }),
                PropertyPaneTextField('upcomingEventsListName', {
                  label: 'Upcoming Events List Name',
                  description: 'Name of the SharePoint list for Upcoming Events (default: UpcomingEvents)'
                }),
                PropertyPaneToggle('useMockData', {
                  label: 'Use Demo Data',
                  onText: 'Enabled (Demo Mode)',
                  offText: 'Disabled (Live SharePoint Data)'
                }),
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
