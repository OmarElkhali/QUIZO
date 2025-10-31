#!/usr/bin/env node

/**
 * QUIZO - Script de Vérification Rapide
 * Vérifie l'état des services et URLs
 */

import https from 'https';

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const ENDPOINTS = [
  {
    name: 'Frontend (Vercel)',
    url: 'https://quizo-ruddy.vercel.app',
    expected: 200
  },
  {
    name: 'Backend Health (Render)',
    url: 'https://quizo-nued.onrender.com/health',
    expected: 200
  },
  {
    name: 'Backend Extract API',
    url: 'https://quizo-nued.onrender.com/api/extract-text',
    expected: 405 // Method not allowed (GET), mais service actif
  }
];

function checkUrl(endpoint) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    https.get(endpoint.url, { timeout: 10000 }, (res) => {
      const duration = Date.now() - startTime;
      
      if (res.statusCode === endpoint.expected || 
          (endpoint.name.includes('Extract') && res.statusCode === 405)) {
        console.log(`${COLORS.green}✓${COLORS.reset} ${endpoint.name}: ${COLORS.green}OK${COLORS.reset} (${res.statusCode}) - ${duration}ms`);
        resolve({ success: true, duration });
      } else {
        console.log(`${COLORS.yellow}⚠${COLORS.reset} ${endpoint.name}: ${COLORS.yellow}Unexpected status${COLORS.reset} (${res.statusCode}) - ${duration}ms`);
        resolve({ success: false, duration });
      }
    }).on('error', (err) => {
      const duration = Date.now() - startTime;
      console.log(`${COLORS.red}✗${COLORS.reset} ${endpoint.name}: ${COLORS.red}FAILED${COLORS.reset} - ${err.message} - ${duration}ms`);
      resolve({ success: false, duration });
    }).on('timeout', () => {
      console.log(`${COLORS.red}✗${COLORS.reset} ${endpoint.name}: ${COLORS.red}TIMEOUT${COLORS.reset} (>10s)`);
      resolve({ success: false, duration: 10000 });
    });
  });
}

async function main() {
  console.log('\n' + COLORS.blue + '🧪 QUIZO - Vérification des Services' + COLORS.reset);
  console.log('=====================================\n');
  
  const results = [];
  
  for (const endpoint of ENDPOINTS) {
    const result = await checkUrl(endpoint);
    results.push(result);
  }
  
  console.log('\n' + COLORS.blue + '📊 Résumé' + COLORS.reset);
  console.log('=========\n');
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`Tests réussis: ${successCount}/${totalCount}`);
  console.log(`Temps moyen: ${Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length)}ms`);
  
  if (successCount === totalCount) {
    console.log('\n' + COLORS.green + '✓ Tous les services sont opérationnels !' + COLORS.reset + '\n');
    process.exit(0);
  } else {
    console.log('\n' + COLORS.yellow + '⚠ Certains services ont des problèmes' + COLORS.reset + '\n');
    process.exit(1);
  }
}

main();
