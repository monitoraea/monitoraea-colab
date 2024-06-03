/* In React Native Tools must be pre-declared :-( */
import { lazy } from 'react';

const tools = {
  Agora: lazy(() => import('./Agora')),
  Communities: lazy(() => import('./Communities')),
  ProjectManager: lazy(() => import('./ProjectManager')),
  Members: lazy(() => import('./Members')),
  NetworkHome: lazy(() => import('./NetworkHome')),
  NetworkHomeCIEA: lazy(() => import('./NetworkHomeCIEA')),
  CIEAHome: lazy(() => import('./CIEAHome')),
  CMS: lazy(() => import('./CMS')),
  MenuManager: lazy(() => import('./MenuManager')),
  DashboardADM: lazy(() => import('./DashboardADM')),
  DashboardParticipation: lazy(() => import('./DashboardParticipation')),

  HelpNotification: lazy(() => import('./notifications/HelpNotification')),
  NewOrganizationNotification: lazy(() => import('./notifications/NewOrganizationNotification')),
  NewUserNotification: lazy(() => import('./notifications/NewUserNotification')),
  MessageNotification: lazy(() => import('./notifications/MessageNotification')),
  PublishNotification: lazy(() => import('./notifications/PublishNotification')),
  ParticipationNotification: lazy(() => import('./notifications/ParticipationNotification')),
  BroadcastNotification: lazy(() => import('./notifications/BroadcastNotification')),
  SendingBroadcastNotification: lazy(() => import('./notifications/SendingBroadcastNotification')),
  IndicationNotification: lazy(() => import('./notifications/IndicationNotification')),
  NewIndicatedProjectNotification: lazy(() => import('./notifications/NewIndicatedProjectNotification')),
  NewGTADMNotification: lazy(() => import('./notifications/NewGTADMNotification')),
  BasicReportNotification: lazy(() => import('./notifications/BasicReportNotification')),
  NewContactFromSite: lazy(() => import('./notifications/NewContactFromSite')),
  NewGeneralContactFromSite: lazy(() => import('./notifications/NewGeneralContactFromSite')),
};

export default tools;
