const axios = require('axios');
const fs = require('fs');
const path = require('path');

(async () => {
    try {
        console.log('Fetching TLDs data from IANA...');
        const res = await axios('https://data.iana.org/rdap/dns.json');
        const data = res.data;
        
        if (data && data.services) {
            const tldsPath = path.join(__dirname, '..', 'lib', 'tlds.json');
            fs.writeFileSync(tldsPath, JSON.stringify(data.services));
            console.log('Updated tlds.json');
            console.log(`Total TLD services: ${data.services.length}`);
        } else {
            console.log('Couldn\'t get tlds');
            process.exit(1);
        }
    } catch (error) {
        console.error('Error updating TLDs:', error.message);
        process.exit(1);
    }
    process.exit(0);
})();