import { IListedCity } from "./IListedCity";
import { IWeather } from "./IWeather";

export interface ICityInfo{
    city:IListedCity;
    weather:IWeather;
    dateTime:Date;
}