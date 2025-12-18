# Projekt-GTA

To run the python App the conda environment **gta25** should be installed. The _.yml_ file is provided.

## Folder structure

- `/backend/*`. Python data analysis after collecting the raw data. **app.py** needs to be strated to run the flask server.
- `/css/*`. styles for the webapp
- `/data/*`. Used data files for the webapp containing 2 static layers displayed on the webmap.
  - `/data/sld_files/*` used SLD styles for the Geoserver. Some minor adjustements ware made directly in the Geoserver app
- `/js/*`. all the functions to run the webapp
- `/index.html`. the main html file
- `/environment.yml`. the conda env
