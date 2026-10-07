let model;
let webcam;
let running = false;

const MODEL_URL = "./modelo/model.json";
const METADATA_URL = "./modelo/metadata.json";

const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");

const resultText = document.getElementById("resultado");
const confidenceText = document.getElementById("confianza");

const thresholdInput = document.getElementById("threshold");

const imageUpload = document.getElementById("imageUpload");
const preview = document.getElementById("preview");
const classifyButton = document.getElementById("classifyButton");

const historyList = document.getElementById("historyList");
const clearHistoryButton = document.getElementById("clearHistory");



async function loadModel() {

    try {

        resultText.textContent = "Cargando modelo...";

        model = await tmImage.load(
            MODEL_URL,
            METADATA_URL
        );

        resultText.textContent = "Modelo cargado. Pulsa Iniciar.";

        console.log("Modelo cargado correctamente.");

    } catch (error) {

        console.error(error);

        resultText.textContent =
            "Error al cargar el modelo.";

    }

}




async function startCamera() {

    if (!model) {
        await loadModel();
    }

    if (running) {
        return;
    }

    try {

        webcam = new tmImage.Webcam(
            400,
            400,
            true
        );

        await webcam.setup();
        await webcam.play();

        running = true;

        document
            .getElementById("webcam-container")
            .innerHTML = "";

        document
            .getElementById("webcam-container")
            .appendChild(webcam.canvas);

        window.requestAnimationFrame(loop);

        resultText.textContent = "Clasificando...";

    } catch (error) {

        console.error(error);

        resultText.textContent =
            "No se pudo acceder a la cámara.";

    }

}



async function loop() {

    if (!running) {
        return;
    }

    webcam.update();

    await predict(webcam.canvas);

    window.requestAnimationFrame(loop);

}




async function predict(image) {

    if (!model) {
        return;
    }

    const predictions = await model.predict(image);

    let bestPrediction = predictions[0];

    for (let i = 1; i < predictions.length; i++) {

        if (
            predictions[i].probability >
            bestPrediction.probability
        ) {

            bestPrediction = predictions[i];

        }

    }

    const confidence =
        bestPrediction.probability * 100;

    const threshold =
        Number(thresholdInput.value);

    confidenceText.textContent =
        `Confianza: ${confidence.toFixed(2)}%`;

    if (confidence >= threshold) {

        resultText.textContent =
            `Resultado: ${bestPrediction.className}`;

    } else {

        resultText.textContent =
            "No hay coincidencia suficiente.";

    }

}




function stopCamera() {

    running = false;

    if (webcam) {

        webcam.stop();

        document
            .getElementById("webcam-container")
            .innerHTML = "";

    }

    resultText.textContent =
        "Clasificación detenida.";

    confidenceText.textContent =
        "Confianza: -";

}




imageUpload.addEventListener(
    "change",
    function(event) {

        const file = event.target.files[0];

        if (!file) {
            return;
        }

        const reader = new FileReader();

        reader.onload = function(e) {

            preview.src = e.target.result;

        };

        reader.readAsDataURL(file);

    }
);



classifyButton.addEventListener(
    "click",
    async function() {

        if (!model) {

            await loadModel();

        }

        if (!preview.src) {

            resultText.textContent =
                "Primero selecciona una imagen.";

            return;

        }

        const predictions =
            await model.predict(preview);

        let bestPrediction =
            predictions[0];

        for (
            let i = 1;
            i < predictions.length;
            i++
        ) {

            if (
                predictions[i].probability >
                bestPrediction.probability
            ) {

                bestPrediction =
                    predictions[i];

            }

        }

        const confidence =
            bestPrediction.probability * 100;

        const threshold =
            Number(thresholdInput.value);

        confidenceText.textContent =
            `Confianza: ${confidence.toFixed(2)}%`;

        if (confidence >= threshold) {

            resultText.textContent =
                `Resultado: ${bestPrediction.className}`;

            addToHistory(
                bestPrediction.className,
                confidence
            );

        } else {

            resultText.textContent =
                "No hay coincidencia suficiente.";

        }

    }
);




function addToHistory(result, confidence) {

    const date = new Date();

    const time =
        date.toLocaleTimeString();

    const item =
        document.createElement("li");

    item.textContent =
        `${time} - ${result} (${confidence.toFixed(2)}%)`;

    historyList.prepend(item);

}



clearHistoryButton.addEventListener(
    "click",
    function() {

        historyList.innerHTML = "";

    }
);




startButton.addEventListener(
    "click",
    startCamera
);

stopButton.addEventListener(
    "click",
    stopCamera
);



loadModel();