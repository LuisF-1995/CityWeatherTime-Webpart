import * as React from 'react';
import styles from './TimeWeather.module.scss';
import type { ITimeWeatherProps } from './ITimeWeatherProps';
import { PNP } from '../../services/Util';
import { SiteUserProps } from 'sp-pnp-js/lib/sharepoint/siteusers';
import { IWeather } from '../models/IWeather';
import { IListedCity } from '../models/IListedCity';
import { Box, Container, Grid, IconButton, Paper, Tooltip } from '@mui/material';
import { ICityInfo } from '../models/ICityInfo';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';import AddLocationRoundedIcon from '@mui/icons-material/AddLocationRounded';
import AddNewCityModal from './newCity/AddNewCity';

import { climaHoraListName } from '../../services/Constants';
import Swal from 'sweetalert2';

let secondsCounter:number = 0;
let intervalId:any;

interface ITimeWeatherStates {
  citiesInfo:ICityInfo[]; 
  editInfo:boolean; 
  showModalAddCity:boolean; 
  disableDelCityButton:boolean;
  currentUser: SiteUserProps;
}
export default class TimeWeather extends React.Component<ITimeWeatherProps, ITimeWeatherStates> {
  private pnp:PNP;
  
  constructor(props:ITimeWeatherProps){
    super(props);
    this.pnp = new PNP(this.props.context);

    this.state = {
      citiesInfo:[],
      editInfo:false,
      showModalAddCity: false,
      disableDelCityButton: false,
      currentUser: {
        Email: '',
        Id: 0,
        IsHiddenInUI: false,
        IsShareByEmailGuestUser: false,
        IsSiteAdmin: false,
        LoginName: '',
        PrincipalType: 0,
        Title: ''
      }
    };
  }

  async componentDidMount(): Promise<void> {
    await this.getCityWeather();
  }

  private startMonitoring():void {
    intervalId = setInterval(() => {
      let citiesUpdatedInfo:ICityInfo[] = [];
      this.state.citiesInfo && this.state.citiesInfo.length > 0 && this.state.citiesInfo.forEach((city:ICityInfo) => {
        const newTime = new Date();
        
        if (newTime.getMinutes() !== city.dateTime.getMinutes()) {
          city.dateTime = newTime;
          citiesUpdatedInfo.push(city);
        }
      });

      if(citiesUpdatedInfo.length > 0){
        this.setState({ citiesInfo: citiesUpdatedInfo }, () => {
          citiesUpdatedInfo = []
        });
      }

      secondsCounter++;

      if(secondsCounter === 360)
        void this.getCityWeather();
    }, 10000);
  }

  private getCityWeather = async():Promise<void> => {
    const listedCitiesRequest:IListedCity[] = await this.getListedCities();
    const citiesInfo:ICityInfo[] = [];

    if(this.props.weatherApiSubscriptionKey && this.props.weatherApiSubscriptionKey !== undefined && this.props.weatherApiSubscriptionKey.length > 0){
      for (const city of listedCitiesRequest) {
        try {
          const cityWeatherRequest:IWeather = await (await fetch(`https://api.weatherapi.com/v1/current.json?key=${this.props.weatherApiSubscriptionKey}&lang=es&aqi=no&q=${city.Coordenadas}`)).json(); // Example https://api.weatherapi.com/v1/current.json?key=0797d4607b564ba7ab5164816241908&lang=es&aqi=no&q=London
          const cityInfo:ICityInfo = {
            city: city,
            weather: cityWeatherRequest,
            dateTime: new Date()
          };
          citiesInfo.push(cityInfo);
        } catch (error) {
          console.error(`Error al obtener informacion del clima para ${city.Ciudad}`);
        }
      }
  
      this.setState({citiesInfo:[]}, () => {
        this.setState({citiesInfo: citiesInfo});
        clearInterval(intervalId);
        secondsCounter = 0;
        this.startMonitoring();
      });
    }
    else
      console.warn("La webpart TimeWeather tiene el siguiente error: No se puede obtener informacion de clima, porque falta 'Weather API subscription key', asignada por el administrador del sitio en las propiedades al desplegar la webpart.");
  }

  private getListedCities = async (): Promise<IListedCity[]> => {
    try {
      const currentUser:SiteUserProps = await this.pnp.getCurrentUser();
      this.setState({currentUser: currentUser});

      const listedCitiesReq:IListedCity[] = await this.pnp.getListItems(climaHoraListName, ["ID", "Ciudad", "Coordenadas", "UserId", "AuthorId", "EditorId", "Global"], `(UserId eq ${currentUser.Id}) or (Global eq 1)`, "");
      const listedCities: IListedCity[] = listedCitiesReq && listedCitiesReq.length > 0 ?
            listedCitiesReq.filter((item:IListedCity) => item.Coordenadas && item.Coordenadas.length > 0)  // Filtra solo los elementos con Coordenadas válidas
            : [];
      return listedCities;
    } catch (error) {
      console.error(`Error al intentar obtener las ciudades listadas en ${climaHoraListName}: ${error}`);
      return [];
    }
  }

  openAddCityModal = ():void => {
    this.setState({ showModalAddCity: true });
  };

  closeAddCityModal = ():void => {
    this.setState({ showModalAddCity: false });
  };

  private removeCity = (cityInfo:ICityInfo):void => {
    this.setState({
      disableDelCityButton:true
    });

    Swal.fire({
      icon: 'warning',
      title: `Desea eliminar ${cityInfo.city.Ciudad}?`,
      text: 'Si procede, la información de la ciudad se eliminará.',
      showCancelButton: true
    })
    .then((response) => {
      if(response.isConfirmed && cityInfo && cityInfo.city && cityInfo.city.ID && cityInfo.city.ID !== undefined)
        this.pnp.deleteItem(climaHoraListName, cityInfo.city.ID)
        .then(() => {
          Swal.fire({
            title: 'Eliminacion exitosa',
            text: `${cityInfo.city.Ciudad} fue eliminada exitosamente de la lista`,
            icon: 'success'
          })
          .then(() => {
            this.getCityWeather()
            .then(() => {
              this.setState({
                disableDelCityButton:false
              });
            })
            .catch(() => {
              this.setState({
                disableDelCityButton:false
              });
              console.error("Error al traer informacion del componente TimeWeather")
            });
          })
          .catch(() => {
            this.setState({
              disableDelCityButton:false
            });
          })
        })
        .catch(error => {
          console.error(`Error al eliminar el elemento con ID: ${cityInfo.city.ID} de la lista: ${climaHoraListName}: ${error}`);
        })
      else
        this.setState({
          disableDelCityButton:false
        });
    })
    .catch(() => {
      this.setState({
        disableDelCityButton:false
      });
    });
  };

  public render(): React.ReactElement<ITimeWeatherProps> {
    const {
      hasTeamsContext,
    } = this.props;

    if(!this.props.weatherApiSubscriptionKey || this.props.weatherApiSubscriptionKey === undefined || this.props.weatherApiSubscriptionKey.length === 0){
      return (
        <Container maxWidth="lg" className={`${styles.timeWeather} ${hasTeamsContext ? styles.teams : ''}`}>
          <section >
            <h2 style={{color:'black', margin:0, padding:0}}>Clima y hora</h2>
            <h4>No se ha ingresado la llave de subscripcion de weather API, favor contactar al administrador del sitio</h4>
          </section>
        </Container>
      );
    }
    
    return (
      <Container maxWidth="lg" className={`${styles.timeWeather} ${hasTeamsContext ? styles.teams : ''}`}>
        <section className={styles.cardHeader} >
          <h2 style={{color:'black', margin:0, padding:0}}>Clima y hora</h2>
          <Tooltip title={this.state.editInfo ? 'Cancelar edición':'Editar tarjetas'} arrow>
            <IconButton aria-label="Edit" size='large' color='primary' onClick={() => {this.setState({editInfo: !this.state.editInfo})}} >
              {
                this.state.editInfo ?
                <CloseRoundedIcon/>
                :
                <EditRoundedIcon />
              }
            </IconButton>
          </Tooltip>
          {
            this.state.editInfo &&
            <Tooltip title='Agregar ciudad' arrow>
              <IconButton aria-label="Add city" size='large' color='success' onClick={this.openAddCityModal} >
                <AddLocationRoundedIcon/>
              </IconButton>
            </Tooltip>
          }
        </section>
        <Grid container direction="row" justifyContent="flex-start" alignItems="stretch" spacing={2} flexWrap="nowrap" padding={1} margin={0} sx={{overflowX:"auto", columnGap:"15px"}} >
          {this.state.citiesInfo && this.state.citiesInfo.length > 0 && this.state.citiesInfo.map((cityInfo:ICityInfo, index:number) => {
            return(
              <Grid item key={index} sx={{margin:"0px !important", padding:"0px !important"}}>
                <Paper sx={{padding:2}} className={styles.cardContainer} >
                  {
                    this.state.editInfo &&
                    <Tooltip title='Eliminar ubicación' className={styles.delCityButton}>
                      <IconButton aria-label="RemoveCity" size='large' color='error' onClick={() => this.removeCity(cityInfo)} disabled={this.state.disableDelCityButton || (cityInfo.city.Global && !this.state.currentUser.IsSiteAdmin)} >
                        <RemoveCircleOutlineRoundedIcon />
                      </IconButton>
                    </Tooltip>
                  }
                  <div style={{margin:0, padding:0, height:"20%", width:"100%", display:"flex", justifyContent:"flex-start", alignItems:"center"}}>
                    <h4 style={{margin:0, padding:0}}>{cityInfo?.weather?.location?.name}, {cityInfo?.weather?.location?.country}</h4>
                  </div>
                  <Grid container direction="row" justifyContent="space-between" alignItems="stretch" flexWrap="nowrap" padding={0} margin={0} columnGap={1} height="80%" width="100%" >
                    <Grid item padding={0} margin={0} xs={6} height="100%" paddingBottom={2} >
                      <Box className={styles.tempAndWeatherContainer}>
                        <h3>{cityInfo?.weather?.current?.temp_c} °C</h3>
                        <p>{cityInfo?.weather?.current?.condition?.text}</p>
                      </Box>
                    </Grid>
                    <Grid item padding={0} margin={0} xs={6} height="100%" paddingBottom={2} >
                      <Box className={styles.tempAndWeatherContainer}>
                        <h3>{cityInfo?.dateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: cityInfo?.weather?.location?.tz_id })}</h3>
                        <p>{cityInfo?.dateTime.toLocaleDateString('es-CO', {year: 'numeric', month: 'long', day: 'numeric', timeZone: cityInfo?.weather?.location?.tz_id })}</p>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )
          })}
        </Grid>
        <AddNewCityModal context={this.props.context} showModal={this.state.showModalAddCity} closeModal={this.closeAddCityModal} listCitiesInfo={this.state.citiesInfo} getCityWeather={this.getCityWeather} currentUser={this.state.currentUser}/>
      </Container>
    )
  }
}
