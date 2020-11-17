/**  This module implements the interaction of the Fortaleza Digital Skill with
 * the Amazon Echo device
 */

// Local para importar a função de mongo
//const searchDB = require('./searchOnMongo');

const mongo = require('mongodb').MongoClient;
let client = new mongo(`mongodb://queryUser:ftdigital1234@ds151994.mlab.com:51994/prefeitura`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
let coll;

exports.handler = function (event, context) {// EVENT = req.body ---- CONTEXT = objeto de função ( FAIL | SUCCEED )
    try {
        //console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * prevent someone else from configuring a skill that sends requests to this function.
         * To be uncommented when SKill is ready

         if (event.session.application.applicationId !== "amzn1.ask.skill.44e7e13a-7dff-49c6-be3b-f5e18a3bb9fa") {
             context.fail("Invalid Application ID");
        }
         */
        // req.body.session.new
        // Resseta só o requestID para mostrar no log
        if (event.session.new) {
            onSessionStarted({
                requestId: event.request.requestId
            }, event.session);
        }
        // req.body.request.type
        // INICIAR A SKILL
        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request, event.session, function callback(sessionAttributes, speechletResponse) {
                context.succeed(buildResponse(sessionAttributes, speechletResponse));//sessionAttributes = {} | speechletResponse = outputSpeech/card/reprompt/shouldSessionEnd
            });

            // QUALQUER INTENÇÃO
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request, event.session, function callback(sessionAttributes, speechletResponse) {
                context.succeed(buildResponse(sessionAttributes, speechletResponse));
            });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        //context.fail("Exception: " + e);
        console.log('exception: ' + e.message);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId + ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
// launchRequest = request | session = session | callback = montar a mensagem e enviar
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId + ", sessionId=" + session.sessionId);
    // Dispatch to skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {

    console.log(intentRequest);
    let intent = intentRequest.intent;
    let intentName = extractValue('PreviousIntent', intent, session);

    console.log('CURRENT Intent is ' + intent.name);//pega o nome da intenção atual
    console.log('PREVIOUS intent was ' + intentName);//pega o nome da intenção antiga se tiver

    if ("AMAZON.StopIntent" === intent.name ||
        "AMAZON.CancelIntent" === intent.name || "NaoQuerer" === intent.name) {
        handleSessionEndRequest(callback);
    }

    if (intentName === null) {
        intentName = intent.name;
    }

    if (intent.name === "descricao" || intent.name === "etapas" || intent.name === "requisitos" || intent.name === "link"
        || intent.name === "horario" || intent.name === "area_responsavel" || intent.name === "enderecos") {

        getService(intent, session, callback);
    } else {
        // Dispatch to your skill's intent handlers
        switch (intentName) {
            case "DigaOi":
                sayHello(intent, session, callback);
                break;

            case "Obrigado":
                sayDeNada(intent, session, callback);
                break;

            case "AMAZON.HelpIntent":
                getWelcomeResponse(callback);
                break;

            case "AMAZON.NavigateHomeIntent":
                getWelcomeResponse(callback);
                break;

            default:
                throw "Invalid intent";
        }
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId + ", sessionId=" + session.sessionId);
}

// --------------- Functions that control the skill's behavior -----------------------
function getWelcomeResponse(callback) {
    let sessionAttributes = {};
    let cardTitle = "Welcome";
    let speechOutput = getWelcomeMessage(); // Retorna String de bem vindo

    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    let repromptText = 'Diga o serviço de sua preferência! Tente começar por Extrato I.P.T.U.';
    let shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    let cardTitle = "Session Ended";
    let speechOutput = "";

    let message = [];
    message[0] = "Tchau! Até a próxima! Fechando skill em. 3. 2. 1.";
    message[1] = "Até outro dia! Fechando skill em. 3. 2. 1.";
    message[2] = "Tchau! Desligando por agora! Fechando skill em. 3. 2. 1.";

    speechOutput = message[getRandomInt(0, message.length - 1)];
    // Setting this to true ends the session and exits the skill.
    let shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}


/**
 * FTD Interactions
 */
function sayHello(intent, session, callback) {

    let cardTitle = intent.name;
    let repromptText = "";
    let sessionAttributes = {};
    let shouldEndSession = false;
    let speechOutput = "";

    let message = [];
    message[0] = "Olá para você também! Com qual assunto posso te ajudar hoje?";
    message[1] = "Oie! Que bom você por aqui! Com qual assunto posso te ajudar hoje?";
    message[2] = "Oi para você também! Com qual assunto posso te ajudar hoje?";

    speechOutput = message[getRandomInt(0, message.length - 1)];

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}


function sayDeNada(intent, session, callback) {

    let cardTitle = intent.name;
    let repromptText = "";
    let sessionAttributes = {};
    let shouldEndSession = false;
    let speechOutput = "";

    let message = [];
    message[0] = "De nada! Espero ter te ajudado! Fique em casa durante a quarentena e não esqueça de usar máscara! Fechando skill em. 3. 2. 1.";
    message[1] = "Não a de que! Fique em casa durante a quarentena e não esqueça de usar máscara! Fechando skill em. 3. 2. 1.";
    message[2] = "Foi um prazer te ajudar e lembre-se! Fique em casa durante a quarentena e não esqueça de usar máscara! Fechando skill em. 3. 2. 1.";

    speechOutput = message[getRandomInt(0, message.length - 1)];

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}


function getService(intent, session, callback) {

    let cardTitle = intent.name;
    let repromptText = "";
    let sessionAttributes = {};
    let shouldEndSession = false;
    let speechOutput = "";

    let servico = intent.slots[Object.keys(intent.slots)[0]].resolutions.resolutionsPerAuthority[0];

    if (servico.status.code !== "ER_SUCCESS_NO_MATCH") {
        // speechOutput = `${servico.values[0].value.name}`;
            // callback(sessionAttributes,
            //     buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        client.connect(() => {
            coll = client.db("prefeitura").collection("services");
            coll.findOne({servico: servico.values[0].value.name}, (e, result) => {
                if (!e || result !== null) {
                    if(result[cardTitle] !== null) {
                        speechOutput = `${intent.name} de ${servico.values[0].value.name}... ${result[cardTitle]}. Deseja saber algo mais sobre algum assunto?`;
                        callback(sessionAttributes,
                            buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
                    }else{
                        speechOutput = `Não tenho nenhuma informação de ${intent.name} de ${servico.values[0].value.name}. Deseja saber algo mais sobre algum assunto?`;
                        callback(sessionAttributes,
                            buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
                    }
                } else {
                    speechOutput = `Não consegui entender muito bem de qual serviço você está querendo saber ${cardTitle}`;
                    callback(sessionAttributes,
                        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
                }
            });
            // callback(sessionAttributes,
            //     buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        });
    } else {
        speechOutput = `Não consegui entender muito bem de qual serviço você está querendo saber ${cardTitle}`;
        callback(sessionAttributes,
            buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }
}

// --------------- Handle of Session Attributes -----------------------
function extractValue(attr, intent, session) {

    console.log("Extracting " + attr);

    if (session.attributes) {
        if (attr in session.attributes) {
            console.log("Session attribute " + attr + " is " + session.attributes[attr]);
            return session.attributes[attr];
        }
    }

    console.log("No session attribute for " + attr);

    if (intent.slots) {
        if (attr in intent.slots && 'value' in intent.slots[attr]) {
            let slot = intent.slots[attr]
            try {
                //Try to returns slot ID otherwise returns slot value
                return slot.resolutions.resolutionsPerAuthority[0].values[0].value.id
            } catch (e) {
                return intent.slots[attr].value;
            }
        }
    }
    ;
    return null;
}

// --------------- Auxiliar Functions Formatting -----------------------

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// -------------------- Speech Functions Formatting -----------------------
//Mensagem de bem vindo
//Pode colocar várias ele pega uma aleatória
function getWelcomeMessage() {
    let hour = new Date().getHours() - 3;
    if (hour >= 18) {
        return "Boa noite! Sou o Tião, assistente inteligente do portal Fortaleza Digital e posso te ajudar com informações dos serviços ofertados pela Prefeitura de Fortaleza! Sobre qual serviço conversaremos?";
    } else if (hour <= 12) {
        return "Bom dia! Sou o Tião, assistente inteligente do portal Fortaleza Digital e posso te ajudar com informações dos serviços ofertados pela Prefeitura de Fortaleza! Sobre qual serviço conversaremos?";
    } else {
        return "Boa tarde! Sou o Tião, assistente inteligente do portal Fortaleza Digital e posso te ajudar com informações dos serviços ofertados pela Prefeitura de Fortaleza! Sobre qual serviço conversaremos?";
    }
}

// --------------- Helpers that build all of the responses -----------------------
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    console.log("ALEXA: " + output);
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Standard",
            title: title,
            text: output,
            image: {
                smallImageUrl: "https://i.imgur.com/FVTjmsN.png"
            }
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}


// function handleSessionAttributes(sessionAttributes, attr, value) {
//
//     //if Value exists as attribute than returns it
//     console.log("Previous " + attr + "is: " + value)
//     if (value) {
//         sessionAttributes[attr] = value;
//     }
//     return sessionAttributes;
// }

// function stringQuarter(input) {
//
//     if (input == '01' || input == 'Q1') {
//         return 'first';
//     }
//
//     if (input == '02' || input == 'Q2') {
//         return 'second';
//     }
//
//     if (input == '03' || input == 'Q3') {
//         return 'third';
//     }
//
//     if (input == '04' || input == 'Q4') {
//         return 'fourth';
//     }
//
// }

// function extractItem(item) {
//     if (item === null) {
//         return null;
//     }
//
//     let auxitem = item.toLowerCase();
//
//     if (auxitem.indexOf('ink') >= 0) {
//         return 'I00008';
//     }
//
//     if (auxitem.indexOf('paper') >= 0) {
//         return 'R00001';
//     }
//
//     if (auxitem.indexOf('drive') >= 0) {
//         return 'I00004';
//     }
//     return item;
// }
