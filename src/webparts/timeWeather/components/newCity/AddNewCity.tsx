import * as React from 'react';
import styles from './AddCity.module.scss';
import { PNP } from '../../../services/Util';
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { Autocomplete, Backdrop, Box, Button, CircularProgress, Fade, Grid, Modal, TextField, Typography } from '@mui/material';
import Geonames from 'geonames.js';
import { ICity } from './ICity';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AddHomeWorkRoundedIcon from '@mui/icons-material/AddHomeWorkRounded';
import { ICityInfo } from '../../models/ICityInfo';
import { climaHoraListName } from '../../../services/Constants';
import { IListedCity } from '../../models/IListedCity';
import { SiteUserProps } from 'sp-pnp-js/lib/sharepoint/siteusers';
import Swal from 'sweetalert2';

interface IAddNewCityModalStates{
    citiesArray:ICity[]; 
    loadingCities:boolean; 
    selectedCity:ICity|null;
    disableAddButton:boolean;
}

export interface IAddNewCityModalProps{
    context: WebPartContext;
    showModal: boolean;
    closeModal:() => void;
    listCitiesInfo: ICityInfo[];
    getCityWeather: () => void;
    currentUser: SiteUserProps;
}

export default class AddNewCityModal extends React.Component<IAddNewCityModalProps, IAddNewCityModalStates> {
    private pnp:PNP;
    constructor(props:IAddNewCityModalProps){
        super(props);
        this.pnp = new PNP(this.props.context);

        this.state = {
            citiesArray: [],
            loadingCities: false,
            selectedCity: null,
            disableAddButton: false
        };
    }

    private getCitiesSearch = (searchParam:string): void => {
        this.setState({loadingCities:true});
        const geonames = Geonames({
            username: 'lurodev',
            lan: 'es',
            encoding: 'JSON'
        });

        geonames.search({q: searchParam})
        .then((results:{geonames:ICity[], totalResultsCount:number}) => {
            this.setState({
                loadingCities: false,
                citiesArray: results.geonames
            });
        })
        .catch(error => {
            console.error('Error al intentar obtener la ciudad: ', error);
            this.setState({loadingCities:false});
        });
        
    }

    private addNewCity = async ():Promise<void> => {
        if(this.state.selectedCity && this.state.selectedCity.name && this.state.selectedCity.name !== undefined && this.state.selectedCity.name.length > 0 && this.state.selectedCity.lat && this.state.selectedCity.lat !== undefined && this.state.selectedCity.lat.length > 0 && this.state.selectedCity.lng && this.state.selectedCity.lng !== undefined && this.state.selectedCity.lng.length > 0){
            this.setState({
                disableAddButton:true
            });
            const existentCity:ICityInfo[] = this.props.listCitiesInfo && this.props.listCitiesInfo.length > 0 ? this.props.listCitiesInfo.filter(city => city?.city?.Ciudad === this.state.selectedCity?.name) : [];

            if(!existentCity || existentCity.length === 0){
                const newCity:IListedCity = {
                    Ciudad: this.state.selectedCity?.name ? this.state.selectedCity.name : '',
                    Coordenadas: this.state.selectedCity?.lat && this.state.selectedCity?.lng ? `${this.state.selectedCity.lat},${this.state.selectedCity.lng}` : '',
                    UserId: this.props.currentUser.Id,
                    Global: this.props.currentUser.IsSiteAdmin
                };

                this.pnp.insertItem(climaHoraListName, newCity)
                .then(() => {
                    Swal.fire({
                        title: 'Ubicación registrada!',
                        text: 'La ciudad fue registrada exitosamente',
                        icon: 'success',
                        confirmButtonText: 'Ok'
                    })
                    .then(() => {
                        this.setState({
                            disableAddButton:false
                        });
                        this.props.getCityWeather();
                    })
                    .catch(() => {
                        this.setState({
                            disableAddButton:false
                        });
                    })
                })
                .catch(error => {
                    console.error(`Error al cargar datos en la lista ${climaHoraListName}: ${error}`);
                });
            }
            else{
                Swal.fire({
                    title: 'Ciudad existente',
                    text: 'La ciudad ya esta creada',
                    icon: 'info',
                    confirmButtonText: 'Ok'
                })
                .then(() => {
                    this.setState({
                        disableAddButton:false
                    });
                })
                .catch(() => {return})
            }
        }
    }

    public render(): React.ReactElement<IAddNewCityModalProps> {
    
    return (
        <Modal
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
            open={this.props.showModal}
            onClose={this.props.closeModal}
            closeAfterTransition
            slots={{ backdrop: Backdrop }}
            slotProps={{
            backdrop: {
                timeout: 500,
            },
            }}
            sx={{zIndex:1}}
        >
            <Fade in={this.props.showModal}>
            <Box className={styles.modalContainer} >
                <Typography id={styles.modalTitle} variant="h4" component="h3">
                    Agregar una ciudad
                </Typography>
                <section className={styles.citySelectorSection}>
                    <Autocomplete
                        loading={this.state.loadingCities}
                        sx={{width:'75%'}}
                        autoComplete
                        includeInputInList
                        filterSelectedOptions
                        noOptionsText="No locations found"
                        value={this.state.selectedCity}
                        options={this.state.citiesArray}
                        getOptionLabel={(city:ICity) => city.name}
                        onInputChange={(cityChange, cityString:string) => {this.getCitiesSearch(cityString)}}
                        onChange={(event, newValue: ICity|null) => {
                            this.setState({
                                citiesArray: newValue ? [newValue, ...this.state.citiesArray] : this.state.citiesArray,
                                selectedCity: newValue
                            });
                        }}
                        renderInput={(params) => (
                            <TextField 
                                {...params} 
                                label="Seleccionar ciudad" 
                                fullWidth
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <React.Fragment>
                                            {this.state.loadingCities ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                        </React.Fragment>
                                    ),
                                }}
                            />
                        )}
                        renderOption={(props, option) => {
                            const { key, ...optionProps } = props;
                            return (
                                <li key={key} {...optionProps}>
                                <Grid container sx={{ alignItems: 'center' }}>
                                    <Grid item sx={{ display: 'flex', width: 44 }}>
                                        <LocationOnIcon sx={{ color: 'text.secondary' }} />
                                    </Grid>
                                    <Grid item sx={{ width: 'calc(100% - 44px)', wordWrap: 'break-word' }}>
                                        <Box>
                                            {option.name}
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {option.adminName1}, {option.countryName}
                                        </Typography>
                                        {/* {parts.map((part: { highlight: any; text: any; }, index: React.Key | null | undefined) => (
                                        <Box
                                            key={index}
                                            component="span"
                                            sx={{ fontWeight: part.highlight ? 'bold' : 'regular' }}
                                        >
                                            {part.text}
                                        </Box>
                                        ))}
                                        <Typography variant="body2" color="text.secondary">
                                        {option.structured_formatting.secondary_text}
                                        </Typography> */}
                                    </Grid>
                                </Grid>
                                </li>
                            );
                        }}
                    />
                    <Button variant='outlined' endIcon={<AddHomeWorkRoundedIcon sx={{m:0}}/>} sx={{width:'25%'}} onClick={this.addNewCity} disabled={this.state.disableAddButton} >
                        Agregar
                    </Button>
                </section>
            </Box>
            </Fade>
        </Modal>
    );
    }
}