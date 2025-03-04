fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.437&lon=24.7535`)

  .then(response => response.json())
  .then(data => {
    const timeseries = data.properties.timeseries;

    for (let i = 0; i < 5; i++) {
      const entry = timeseries[i];
      console.log(`${entry.time} ${entry.data.instant.details.air_temperature}C`);
    }
  });
