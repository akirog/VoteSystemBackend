const http = require('http');
const fs = require('node:fs/promises');


// Seperate classes codes and candidates
// Array all letters and stuff for codes

function get_codes() {
    fs.readFile('./codes.txt', 'utf8', (err, data) => {
        if (err) {
            console.log("err");
            return {};
        } else {
            console.log("parsed");
            return JSON.parse(data);
        }
    })
    console.log("Skipped")
    return {};
}

function get_code(id) {
    let codes = get_codes();

    if (!codes[id]) {
        return {};
    } else {
        return codes[id];
    }
}

function update_codes(data) {
    fs.writeFile('./codes.txt', JSON.stringify(data));
}

let generate_codes = false;

if (generate_codes) {
    let codes = get_codes();

    console.log(codes);

    for (let i = 0; i < 100; i++) {
        let retry = true;
        let code = {};

        while (retry) {
            code = {
                "pass": Math.floor(Math.random() * 10000),
                "class": Math.floor(i/100 * 3),
                "used": false,
            }

            if (!codes[code.pass]) { retry = false; }
        }

        codes[code.pass] = code;

    }

    update_codes(codes);
}



let votes = {
    "kandidat1": 0,
    "kandidat2": 0,
};

const server = http.createServer((req, res) => {

    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write('Welcome to the homepage!');

        for (let k in votes) {
            res.write('\n' + k + ' : ' + votes[k]);
        }

        res.end();
    }
    else if (req.method === 'POST' && req.url === '/vote') {
        let body = '';


        req.on('data', (chunk) => {
            body += chunk.toString();
        })

        req.on('end', () => {
            try {
                let parsedBody = JSON.parse(body);

                if (!parsedBody) {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end("Error: Invalid body");
                }

                if (!parsedBody.code || !get_code(parseInt(parsedBody.code)) || get_code(parseInt(parsedBody.code)).used) {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end("Error: Invalid code");

                } else if (parsedBody.kandidat && parsedBody.kandidat in votes) {
                    votes[parsedBody.kandidat] += 1;

                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('Vote submitted');

                }  else {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('Error: Invalid candidate');
                }


            } catch (e) {
                console.error(e);

                res.writeHead(400, { 'Content-Type': 'text/plain' });
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
