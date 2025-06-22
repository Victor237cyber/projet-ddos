const geoip = require('geoip-lite');
const axios = require('axios');

class GeolocationService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 heures
  }

  // Obtenir les informations géographiques d'une IP
  async getIPInfo(ip) {
    // Vérifier le cache d'abord
    if (this.cache.has(ip)) {
      const cached = this.cache.get(ip);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      // Utiliser geoip-lite pour les IPs publiques
      const geo = geoip.lookup(ip);
      
      if (geo) {
        const ipInfo = {
          ip,
          country: geo.country,
          region: geo.region,
          city: geo.city,
          timezone: geo.timezone,
          ll: geo.ll, // latitude/longitude
          source: 'geoip-lite'
        };

        // Mettre en cache
        this.cache.set(ip, {
          data: ipInfo,
          timestamp: Date.now()
        });

        return ipInfo;
      }

      // Pour les IPs privées ou non trouvées
      return {
        ip,
        country: 'Local',
        region: 'Private Network',
        city: 'Local',
        timezone: 'Local',
        ll: null,
        source: 'local'
      };

    } catch (error) {
      console.error(`Erreur géolocalisation pour ${ip}:`, error);
      return {
        ip,
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        timezone: 'Unknown',
        ll: null,
        source: 'error'
      };
    }
  }

  // Analyser un ensemble d'IPs et obtenir les statistiques géographiques
  async analyzeIPsGeographically(ips) {
    const analysis = {
      total: ips.length,
      countries: {},
      regions: {},
      cities: {},
      suspiciousCountries: [],
      localIPs: 0,
      foreignIPs: 0
    };

    for (const ip of ips) {
      const info = await this.getIPInfo(ip);
      
      // Compter par pays
      analysis.countries[info.country] = (analysis.countries[info.country] || 0) + 1;
      
      // Compter par région
      analysis.regions[info.region] = (analysis.regions[info.region] || 0) + 1;
      
      // Compter par ville
      analysis.cities[info.city] = (analysis.cities[info.city] || 0) + 1;
      
      // Distinguer IPs locales et étrangères
      if (info.source === 'local') {
        analysis.localIPs++;
      } else {
        analysis.foreignIPs++;
      }
    }

    // Identifier les pays suspects (plus de 5 IPs)
    analysis.suspiciousCountries = Object.entries(analysis.countries)
      .filter(([country, count]) => count > 5)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    return analysis;
  }

  // Obtenir la carte des pays pour visualisation
  getCountryMapData(analysis) {
    return Object.entries(analysis.countries).map(([country, count]) => ({
      country,
      count,
      percentage: ((count / analysis.total) * 100).toFixed(1)
    }));
  }

  // Détecter les anomalies géographiques
  detectGeographicAnomalies(analysis) {
    const anomalies = [];
    
    // IPs de pays suspects
    if (analysis.suspiciousCountries.length > 0) {
      anomalies.push({
        type: 'suspicious_country',
        message: `Pays suspect détecté: ${analysis.suspiciousCountries[0].country} avec ${analysis.suspiciousCountries[0].count} IPs`,
        severity: 'medium'
      });
    }

    // Trop d'IPs étrangères
    const foreignPercentage = (analysis.foreignIPs / analysis.total) * 100;
    if (foreignPercentage > 80) {
      anomalies.push({
        type: 'high_foreign_ips',
        message: `${foreignPercentage.toFixed(1)}% d'IPs étrangères détectées`,
        severity: 'high'
      });
    }

    // Distribution anormale
    const countryCount = Object.keys(analysis.countries).length;
    if (countryCount > 10) {
      anomalies.push({
        type: 'many_countries',
        message: `Trafic provenant de ${countryCount} pays différents`,
        severity: 'medium'
      });
    }

    return anomalies;
  }

  // Obtenir les informations détaillées d'une IP
  async getDetailedIPInfo(ip) {
    const basicInfo = await this.getIPInfo(ip);
    
    try {
      // Essayer d'obtenir plus d'informations via une API externe
      const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query`, {
        timeout: 5000
      });

      if (response.data.status === 'success') {
        return {
          ...basicInfo,
          isp: response.data.isp,
          organization: response.data.org,
          as: response.data.as,
          isMobile: response.data.mobile,
          isProxy: response.data.proxy,
          isHosting: response.data.hosting,
          zip: response.data.zip,
          source: 'ip-api'
        };
      }
    } catch (error) {
      console.error(`Erreur API externe pour ${ip}:`, error.message);
    }

    return basicInfo;
  }

  // Nettoyer le cache
  cleanCache() {
    const now = Date.now();
    for (const [ip, data] of this.cache.entries()) {
      if (now - data.timestamp > this.cacheExpiry) {
        this.cache.delete(ip);
      }
    }
  }

  // Obtenir les statistiques du cache
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([ip, data]) => ({
        ip,
        age: Date.now() - data.timestamp
      }))
    };
  }
}

module.exports = GeolocationService; 