# Time Weather Webpart

## Summary

Desarrollo de webpart que se comunica con una lista llamada ClimaHora. Ésta webpart tiene la capacidad de conectarse a diferentes APIs para obtener informacion de las ciudades a nivel mundial y con esto, obtener las coordenadas de una ubicacion, para poder consultar otra API que nos dara la zona horaria para conocer la hora y fecha y el clima de esa ciudad.

## Used SharePoint Framework Version

![version](https://img.shields.io/badge/version-1.18.2-green.svg)

## Applies to

- [SharePoint Framework](https://aka.ms/spfx)
- [Microsoft 365 tenant](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/set-up-your-developer-tenant)

## Prerequisites

- Entorno de trabajo o desarrollo:
Tener instalada la version de node 18.20.2, npm 10.5.2 y gulp CLI version:3.0.0 con gulp local version: 4.0.2.

- Suscripciones a APIs:
Debido a que la aplicacion consume informacion de 2 APIs distintas, la estructura de ésta está desarrollada de modo que la informacion provenga de los siguientes sitios:

API de clima: https://www.weatherapi.com
API de ciudades del mundo: https://www.geonames.org

La subscripcion y uso es gratis, aunque limitado, pero son los usados en este desarrollo.

## Solution

| Solution    | Author(s)                                               |
| ----------- | ------------------------------------------------------- |
| src | Luis Fernando Rodriguez Ortiz |


## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**

---

## Minimal Path to Awesome

- Clone this repository
- Ensure that you are at the solution folder
- Fulfill the prerequisites.
- in the command-line run:
  - **npm install**
  - **gulp serve**
- Agregar la URL de la API de clima al desplegar o probar la webpart, se agrega en la edicion de la webpart (directamente en el sharepoint online), no en el codigo.

## References

- [Getting started with SharePoint Framework](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/set-up-your-developer-tenant)
- [Building for Microsoft teams](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/build-for-teams-overview)
- [Use Microsoft Graph in your solution](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/web-parts/get-started/using-microsoft-graph-apis)
- [Publish SharePoint Framework applications to the Marketplace](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/publish-to-marketplace-overview)
- [Microsoft 365 Patterns and Practices](https://aka.ms/m365pnp) - Guidance, tooling, samples and open-source controls for your Microsoft 365 development
- [Geonames github](https://github.com/kinotto/geonames.js) - ilustra el uso de la API Geonames, para obtener las ciudades del mundo