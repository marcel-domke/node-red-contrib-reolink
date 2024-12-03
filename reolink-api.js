/*
Copyright 2024 Marcel Domke

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// Allow self signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

module.exports = function (RED) {
    function ReolinkApiNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        const ip = config.ip;
        const user = config.user;
        const pass = this.credentials.pass;

        let token = null;
        let tokenRenewInterval = null;
        let queryInterval = null;

        function errorHandle(errorMsg) {
            node.status({ fill: "red", shape: "ring", text: `Error: ${errorMsg}` });
        }

        // Request the token
        async function requestToken() {
            try {
                const response = await fetch(`https://${ip}/api.cgi?cmd=Login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify([
                        {
                            cmd: "Login",
                            param: {
                                User: {
                                    Version: "0",
                                    userName: user,
                                    password: pass
                                }
                            }
                        }
                    ]),
                });
                const data = await response.json();
                if (data[0]?.value?.Token?.name) {
                    token = data[0].value.Token.name;
                    node.status({ fill: "green", shape: "dot", text: "Connected" });
                } else {
                    errorHandle("Received invalid token");
                }
            } catch (error) {
                errorHandle("Connection failed");
            }
        }

        // Fetch specific data
        async function queryCommand(command) {
            if (token) {
                try {
                    const response = await fetch(`https://${ip}/api.cgi?cmd=${command}&token=${token}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" }
                    });
                    const data = await response.json();
                    return data;
                } catch (error) {
                    errorHandle(error.message);
                }
            }
        }

        // Fetch data and send to output
        async function queryStates() {
            mdState = await queryCommand("GetMdState");
            aiStates = await queryCommand("GetAiState");
        
            if (aiStates) {
                node.send({
                    payload: {
                        md: mdState[0]?.value,
                        ai: aiStates[0]?.value
                    }
                });
            }

        }

        // Initialize node
        (async () => {
            node.status({ fill: "yellow", shape: "ring", text: "Connecting..." });
            await requestToken();
            // Clear previous interval and set up token renewal
            if (tokenRenewInterval) clearInterval(tokenRenewInterval);
            tokenRenewInterval = setInterval(requestToken, 30 * 60 * 1000); // Renew token every 30 minutes

            if (queryInterval) clearInterval(queryInterval);
            queryInterval = setInterval(queryStates, 2 * 1000); // Query AI states every 2 seconds
        })();

        node.on("close", () => {
            token = null;
            //Clear intervals
            if (tokenRenewInterval) clearInterval(tokenRenewInterval);
            if (queryInterval) clearInterval(queryInterval);
        });
    }

    RED.nodes.registerType("reolink-api", ReolinkApiNode, {
        credentials: {
            pass: { type: "password" },
        },
    });
};
