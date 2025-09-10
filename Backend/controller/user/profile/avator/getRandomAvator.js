const fs = require('fs');
const path = require('path');

const jsonPath = path.join( process.cwd(),'config/avatorNames.json');

function getRandomAvator(gender) {
    try {
        if (!fs.existsSync(jsonPath)) {
            return {
                success: false,
                message: 'Avatar configuration file not found'
            };
        }
        if(!gender){
            console.log('[getRandomAvator] [Error] gender is required');
            return {
                success: false,
            }}
            

        const data = fs.readFileSync(jsonPath, 'utf8');
        let avators = JSON.parse(data);

        if (avators.length === 0) {
            return {
                success: false,
                message: 'No avatars available'
            }
        }

        avators = avators.filter(avator => avator.gender===gender.toLowerCase());

        const randomIndex = Math.floor(Math.random() * avators.length);
        const randomAvator = avators[randomIndex];
        if (!randomAvator) {

            console.log('[getRandomAvator] [Error] No avatars available for the specified');
            console.log(randomIndex,avators.length,gender.toLowerCase());
            return {
                success: false,
                message: 'No avatars available for the specified'
            }
        }

        return {
            success: true,
            avator: randomAvator
        };
    } catch (error) {
        console.error('[getRandomAvator] [Error] Error in getRandomAvator:', error);
        return {
            success: false,
            message: 'Internal server error',
            error: error.message
        };
    }
}
module.exports = getRandomAvator;