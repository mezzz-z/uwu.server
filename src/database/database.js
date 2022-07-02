const {Pool} = require("pg")

class Database {
    
    config(config){
        this.pool = new Pool(config)
    }
    
    start(callback=null){
        this.pool.connect()
        .then((client) => {
            console.log(`connected to the database on port ${client.port}`)
            this.client = client
            if(callback && typeof callback === 'function'){
                callback()
            }

        }).catch(err => {
            console.log(err)
            process.exit(-1)
        })
    }

    stringifyFilter(filter){
        const keys = Object.keys(filter)
        let values = Object.values(filter)

        let stringifiedFilter = ''
        
        for(let i in keys){
            let filterItem = ''

            if(typeof values[i] === 'string'){
                values[i] = `'${values[i]}'`
            }
            if(i >= 1){
                filterItem += ` AND `
            }

            filterItem += `${keys[i]} = ${values[i]}`
            stringifiedFilter += filterItem
        }

        return stringifiedFilter
    }

    
    async query(...params){
        const data = await this.pool.query(...params)
        return data.rows
    }
}


module.exports = new Database()