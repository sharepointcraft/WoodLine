import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface ILearningAndDevelopmentProps {
  title?: string;
  description: string;
  libraryTitle: string;
  resourcesAndDocumentsListName?: string;
  upcomingEventsListName?: string;
  useMockData: boolean;
  videoExtensions: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  userDisplayName: string;
  context: WebPartContext;
}
