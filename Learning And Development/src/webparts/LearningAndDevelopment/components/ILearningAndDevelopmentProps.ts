import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface ILearningAndDevelopmentProps {
  description: string;
  libraryTitle: string;
  useMockData: boolean;
  videoExtensions: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  userDisplayName: string;
  context: WebPartContext;
}
