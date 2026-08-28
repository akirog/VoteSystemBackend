const http = require('http');
const fs = require('node:fs/promises');


// Separate classes codes and candidates

const code_characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";


async function get_votes() {
    const data = await fs.readFile('./codes.txt', 'utf8');

    if (data == null) {
        return {};
    }

    return JSON.parse(data);
}

async function get_vote(id) {
    let votes = await get_votes();

    if (!votes[id]) {
        return null;
    } else {
        return votes[id];
    }
}

async function update_votes(data) {
    await fs.writeFile('./codes.txt', JSON.stringify(data, null, '\t'));
}

let generate_votes = true;
const classes = ["stit", "stmp", "it", "mp"];

if (generate_votes) {
    generate_new_votes().then();
}

async function generate_new_votes() {
    let votes = {};

    for (let i = 0; i < 400; i++) {
        let retry = true;
        let vote = {};

        while (retry) {
            let code = '';

            for (let j = 0; j < 6; j++) {
                code += code_characters.charAt(Math.floor(Math.random() * code_characters.length));
            }

            vote = {
                "code": code,
                "class": classes[Math.floor(i/400 * 4)],
                "used": false,
            }

            if (!votes[vote.code]) { retry = false; }
        }

        votes[vote.code] = vote;

    }

    await update_votes(votes);
}




let candidates = {
    "stmp": {
        "kandidat1": 0,
        "kandidat2": 0,
    },
    "stit": {
        "kandidat1": 0,
        "kandidat2": 0,
    },
    "mp": {
        "kandidat1": 0,
        "kandidat2": 0,
    },
    "it": {
        "kandidat1": 0,
        "kandidat2": 0,
    }
};

const server = http.createServer((req, res) => {

    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.write('Welcome to the homepage!');

        for (let c in candidates) {
            res.write('\n' + c + ':');
            for (let k in candidates[c]) {
                res.write('\n\t' + k + ' : ' + candidates[c][k]);
            }
        }

        res.end();
    }
    else if (req.method === 'GET' && req.url === '/srv/codes') {
        let data = '';

        req.on('data', (chunk) => { data += chunk.toString(); });

        req.on('end', async () => {
            let body = JSON.parse(data);

            const get_code_password = "gimme_password";

            if (!body.password || body.password.length < 1 || body.password !== get_code_password) {
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end("Error: Invalid password");
            } else {
                let codes = await get_votes();

                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.write(JSON.stringify(codes));
                res.end();
            }

        })
    }
    else if (req.method === 'POST' && req.url === '/srv/vote') {
        let body = '';


        req.on('data', (chunk) => {
            body += chunk;
        })

        req.on('end', async () => {
            try {
                let parsedBody = JSON.parse(body);

                if (!parsedBody) {
                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.end("Error: Invalid body");

                    return;
                }

                if (!parsedBody.code || await get_vote(parsedBody.code) == null || (await get_vote(parsedBody.code)).used) {
                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.end("Error: Invalid code");

                    return;
                }

                let votes = await get_votes();
                let vote = votes[parsedBody.code];

                if (parsedBody.kandidat && parsedBody.kandidat in candidates[vote.class]) {
                    votes[parsedBody.code].used = true;
                    await update_votes(votes);

                    candidates[vote.class][parsedBody.kandidat] += 1;

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
    } else if (req.method === "GET" && req.url === '/srv/class') {
        let data = '';


        req.on('data', (chunk) => {
            data += chunk;
        })


        req.on('end', async () => {
            let body = JSON.parse(data);

            if (!body.code) {
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end("Error: No code given");
                return;
            } else if (!await get_vote(body.code)) {
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end("Error: Invalid code");
                return;
            } else if (!(await get_vote(body.code)).class) {
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end("Error: Code does not have class associated (if you get this something is wrong)");
                return;
            }

            let klasse = (await get_vote(body.code)).class;

            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(klasse + '\n');
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
