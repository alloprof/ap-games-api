/**
 * Simple script to test games configuration loading
 * Usage: node test-config.js
 */

const fs = require('fs')
const path = require('path')
require('dotenv').config()

console.log('🔍 Testing Games Configuration Loading\n')

// Check if GAMES_CONFIG_PATH is set
const configPath = process.env.GAMES_CONFIG_PATH

if (configPath) {
  console.log('✅ GAMES_CONFIG_PATH is set:', configPath)

  const absolutePath = path.isAbsolute(configPath)
    ? configPath
    : path.join(process.cwd(), configPath)

  console.log('📁 Absolute path:', absolutePath)

  if (fs.existsSync(absolutePath)) {
    console.log('✅ Config file exists')

    try {
      const content = fs.readFileSync(absolutePath, 'utf-8')
      const config = JSON.parse(content)

      console.log('✅ Config file is valid JSON')
      console.log('\n📋 Configuration keys found:')
      Object.keys(config).forEach(key => {
        if (typeof config[key] === 'object') {
          console.log(`  - ${key}: [Object with ${Object.keys(config[key]).length} keys]`)
        } else {
          const value = String(config[key])
          const displayValue = value.length > 50
            ? value.substring(0, 47) + '...'
            : value
          console.log(`  - ${key}: ${displayValue}`)
        }
      })

      // Check required fields
      console.log('\n🔍 Checking required fields:')
      const requiredFields = [
        'FIREBASE_FRONTEND_CONFIG',
        'ANALYTICS_SECRET_KEY',
        'GAMES_MEASUREMENT_ID'
      ]

      requiredFields.forEach(field => {
        if (config[field]) {
          console.log(`  ✅ ${field}`)
        } else {
          console.log(`  ❌ ${field} is missing`)
        }
      })

    } catch (error) {
      console.log('❌ Error parsing config file:', error.message)
    }
  } else {
    console.log('❌ Config file does not exist')
    console.log('💡 Create it by running: cp config.games.example.json', configPath)
  }
} else {
  console.log('⚠️  GAMES_CONFIG_PATH is not set')
  console.log('💡 Using individual environment variables instead')

  console.log('\n🔍 Checking environment variables:')
  const envVars = [
    'FIREBASE_FRONTEND_CONFIG',
    'ANALYTICS_SECRET_KEY',
    'GAMES_MEASUREMENT_ID',
    'TWILIO_ACCOUNT_SID',
    'SIB_KEY'
  ]

  envVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`  ✅ ${varName}`)
    } else {
      console.log(`  ❌ ${varName} is not set`)
    }
  })
}

console.log('\n✨ Configuration test complete!')
