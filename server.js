const http = require('http');
const fs = require('node:fs/promises');


// Separate classes codes and candidates

const code_characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";


let code_counter = 0;

async function get_votes() {
    const data = await fs.readFile('./codes.txt', 'utf8');

    if (data == null) {
        return {};
    }

    return JSON.parse(data);
}

function get_vote(id) {
    let votes = get_votes();

    if (!votes[id]) {
        return {};
    } else {
        return votes[id];
    }
}

async function update_votes(data) {
    await fs.writeFile('./codes.txt', JSON.stringify(data, null, '\t'));
}

let generate_votes = false;

if (generate_votes) {
    generate_new_votes().then();
}

async function generate_new_votes() {
    let votes = {};

    for (let i = 0; i < 100; i++) {
        let retry = true;
        let vote = {};

        while (retry) {
            let code = '';

            for (let j = 0; j < 6; j++) {
                code += code_characters.charAt(Math.floor(Math.random() * code_characters.length));
            }

            vote = {
                "code": code,
                "class": Math.floor(i/100 * 4),
                "used": false,
            }

            if (!votes[vote.code]) { retry = false; }
        }

        votes[vote.code] = vote;

    }

    await update_votes(votes);
}




let candidates = {
    "kandidat1": 0,
    "kandidat2": 0,
};

const server = http.createServer((req, res) => {

    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.write('Welcome to the homepage!');

        for (let k in candidates) {
            res.write('\n' + k + ' : ' + candidates[k]);
        }

        res.end();
    }
    else if (req.method === 'GET' && req.url === '/code') {
        let data = '';

        req.on('data', (chunk) => { data += chunk; });

        req.on('end', async () => {
            let body = JSON.parse(data);

            const get_code_password = "gimme_password";

            if (!body.password || body.password.length < 1 || body.password !== get_code_password) {
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end("Error: Invalid password");
            } else if (code_counter > get_votes().length) {
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end("Error: No votes left");
            } else {
                let codes = await get_votes();

                let code = codes.keys()[code_counter];
                code_counter++;

                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end("Code: " + code);
            }

        })
    }
    else if (req.method === 'POST' && req.url === '/vote') {
        let body = '';


        req.on('data', (chunk) => {
            body += chunk.toString();
        })

        req.on('end', async () => {
            try {
                let parsedBody = JSON.parse(body);

                if (!parsedBody) {
                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.end("Error: Invalid body");
                }

                if (!parsedBody.code || !get_vote(parseInt(parsedBody.code)) || get_vote(parseInt(parsedBody.code)).used) {
                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.end("Error: Invalid code");

                } else if (parsedBody.kandidat && parsedBody.kandidat in candidates) {
                    let votes = await get_votes();
                    votes[parsedBody.code].used = true;
                    await update_votes(votes);

                    candidates[parsedBody.kandidat] += 1;

                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.end('Vote submitted');

                } else {

                    res.writeHead(400, {'Content-Type': 'text/plain'});
                    res.end('Error: Invalid candidate');
                }


            } catch (e) {
                console.error(e);

                res.writeHead(400, {'Content-Type': 'text/plain'});
                res.end('Error: Invalid JSON payload');
            }


        })
    }
    // Handle missing routes (404 Not Found)
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

// 3. Start the server on port 3000
server.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
});
