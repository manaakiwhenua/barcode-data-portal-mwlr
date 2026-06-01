const endpoints = [
    {
        url: '/api',
        method: 'GET',
        body: {},
        qs: {},
        headers: {},
        expectedStatus: 200,
        failOnStatusCode: true
    }
]

// Test View
describe('Test /api Webpage', () => {
    endpoints.forEach((endpoint) => {
        it(`Tests for ${endpoint.url}`, () => {
            if(endpoint.expectedStatus == 200){
                cy.intercept({ method: 'GET', url: '/api/**' }, (req) => {
                    let startTime = Date.now();
                    req.continue((res) => {
                        expect(res.statusCode, `Request to ${res.url} failed with status ${res.statusCode}`).to.be.lessThan(400);
                        const endTime = Date.now();
                        const timeSpent = endTime - startTime;
                        expect(timeSpent, `Request to ${res.url} took ${timeSpent}ms`).to.be.lessThan(1000);
                        startTime = Date.now();
                        if (req.url.includes('/api/maps/') || req.url.includes('/api/sequence/') || req.url.includes('/api/qr-code/')) {
                            return;
                        }
                        const responseSize = JSON.stringify(res.body).length;
                        expect(responseSize, `Response to ${res.url} is too small (${responseSize} bytes)`).to.be.greaterThan(10);
                    });
                }).as('allRequests');
                cy.visit({
                    method: endpoint.method,
                    url: endpoint.url,
                    qs: endpoint.qs,
                    headers: endpoint.headers,
                    failOnStatusCode: endpoint.failOnStatusCode
                });
                cy.get('@allRequests.all').then((requests) => {
                    if (requests && requests.length > 0) {
                        cy.wait('@allRequests');
                    } else {
                        // cy.log('No requests to /api/** occurred.');
                    }
                });
            }
            
            cy.request({
                method: endpoint.method,
                url: endpoint.url,
                body: endpoint.body,
                qs: endpoint.qs,
                headers: endpoint.headers,
                failOnStatusCode: endpoint.failOnStatusCode
            }).then((response) => {
                expect(response.status).to.eq(endpoint.expectedStatus);    
                if (endpoint.expectedStatus === 200) {
                    expect(response.body).to.not.be.empty;

                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.body, 'text/html');

                    const bodyExists = doc.querySelector('body') !== null;
                    expect(bodyExists).to.be.true;
                    
                    const scripts = doc.querySelectorAll('script');
                    scripts.forEach(script => script.remove());

                    let bodyText = doc.querySelector('body').textContent.toLowerCase();

                    // code taken from chatgpt to match error patterns in body text
                    const failurePatterns = [
                        /\berror:\s/i,
                        /\bexception\b/i,
                        /\btraceback\b/i,
                        /\b404 not found\b/i,
                    ];
                    const matches = failurePatterns
                        .map((pattern) => ({
                            pattern,
                            match: bodyText.match(pattern),
                        }))
                        .filter(({ match }) => match);

                    matches.forEach(({ pattern, match }) => {
                        const index = match.index;
                        const context = bodyText.slice(
                            Math.max(0, index - 200),
                            Math.min(bodyText.length, index + 500)
                        );
                        });
                    expect(matches.length, `Found ${matches.length} occurrences of error messages in the body text`).to.equal(0);
                    
                    const headExists = doc.querySelector('head') !== null;
                    expect(headExists).to.be.true;

                    const titleExists = doc.querySelector('head > title') !== null;
                    expect(titleExists).to.be.true;
                }
            });
            if (endpoint.tableID != null){
                cy.get(`#${endpoint.tableID} tbody tr`).should('have.length.greaterThan', endpoint.tableMinLen);
            }
        });
    });
});

// Benchmark View
import benchmark from 'cypress-benchmark';

const benchmarkFolder = Cypress.config('benchmarkFolder');
const options = {
    outPath : `${benchmarkFolder}/benchmark_view.json`,
    merge : true,
    runCount: 1
}
endpoints.forEach((endpoint, index) => {
    benchmark(`Benchmark Test for /api`, options, () => {
        const startMark = `start_${endpoint.url}`;
        const endMark = `end_${endpoint.url}`;
        const measureName = `Data load time - ${endpoint.url}`;

        cy.mark(startMark);
        cy.request({
            method: endpoint.method,
            url: endpoint.url,
            body: endpoint.body,
            qs: endpoint.qs,
            headers: endpoint.headers,
            timeout: 60000,
            failOnStatusCode: endpoint.failOnStatusCode
        }).then(() => {
            cy.mark(endMark);
            cy.measure(measureName, startMark, endMark);
        });
        cy.wait(100)
    });
});
