const { getStreams } = require("./providers/pelisplushd.js");

(async () => {

    try {

        const args = process.argv.slice(2);

        let tmdbId;
        let mediaType;
        let season = null;
        let episode = null;

        if (args.length === 0) {

            // Prueba por defecto
            tmdbId = "603";
            mediaType = "movie";

        } else {

            mediaType = args[0];
            tmdbId = args[1];

            if (mediaType === "tv") {
                season = parseInt(args[2], 10);
                episode = parseInt(args[3], 10);
            }

        }

        console.log("==================================");
        console.log("TMDB:", tmdbId);
        console.log("Tipo:", mediaType);
        console.log("Temporada:", season);
        console.log("Episodio:", episode);
        console.log("==================================");

        const streams = await getStreams(
            tmdbId,
            mediaType,
            season,
            episode
        );

        console.log("\n========== RESULTADO ==========");
        console.dir(streams, { depth: null });

    } catch (err) {

        console.error(err);

    }

})();