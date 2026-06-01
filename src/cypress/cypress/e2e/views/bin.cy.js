import { expectNoBodyErrors } from '../../support/common_assertions';

const endpoints = [
    {
        url: '/bin',
        method: 'GET',
        body: {},
        qs: {},
        headers: {},
        expectedStatus: 200,
        failOnStatusCode: true,
    },
    {
        url: '/bin/BOLD:AAI7397', //use a bin url that has been loaded into our test db where the nearest neighbour is also present
        method: 'GET',
        body: {},
        qs: {},
        headers: {},
        expectedStatus: 200,
        failOnStatusCode: true,
        tableID: "resultsTable",
        tableMinLen: 1, // this specific example only has 1 associated record
    }
]

// Test View
describe('Test /bin Webpage', () => {
    endpoints.forEach((endpoint) => {
        it(`Tests for ${endpoint.url}`, () => {
            if(endpoint.expectedStatus == 200){
                cy.intercept({ method: 'GET', url: '/api/**' }, (req) => {
                    let startTime = Date.now();
                    req.continue((res) => {
                        expect(res.statusCode, `Request to ${res.url} failed with status ${res.statusCode}`).to.be.lessThan(400);
                        const endTime = Date.now();
                        const timeSpent = endTime - startTime;
                        // assert response time is less than 2500ms, somewhat arbitrary as this is dependent on the url we're calling which may not always be in BOLD
                        expect(timeSpent, `Request to ${res.url} took ${timeSpent}ms`).to.be.lessThan(2500);
                        startTime = Date.now();

                        // ignore external image calls to a separate url
                        const isExternalImage =
                            res.url.includes('caos.boldsystems.org/api/objects/') ||
                            req.url.includes('caos.boldsystems.org/api/objects/') ||
                            /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(res.url) ||
                            /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(req.url);
                        if (req.url.includes('/api/maps/') || req.url.includes('/api/sequence/') || req.url.includes('/api/qr-code/') || isExternalImage) {
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
            // this endpoint for AAI7397 specifically has only two returned external images to test
            if (endpoint.url.includes('/bin/BOLD:')) {
                cy.get('img[src*="caos.boldsystems.org"]', { timeout: 15000 })
                    .should('have.length.greaterThan', 1)
                    .should(($imgs) => {
                    $imgs.each((_, img) => {
                        expect(img.complete, img.src).to.eq(true);
                        expect(img.naturalWidth, img.src).to.be.greaterThan(0);
                    });
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

                    expectNoBodyErrors(doc);

                    const headExists = doc.querySelector('head') !== null;
                    expect(headExists).to.be.true;

                    const titleExists = doc.querySelector('head > title') !== null;
                    expect(titleExists).to.be.true;
                }
            });
            if (endpoint.tableID != null){  
                cy.get(`#${endpoint.tableID} tbody tr`).should('have.length.at.least', endpoint.tableMinLen);
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
    benchmark(`Benchmark Test for /bin`, options, () => {
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
