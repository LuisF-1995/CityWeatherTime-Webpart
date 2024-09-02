import { WebPartContext } from "@microsoft/sp-webpart-base";
import "@pnp/sp/site-users/web";

export interface ITimeWeatherProps {
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userLoginName: string;
  context: WebPartContext;
  weatherApiUrl:string;
}
