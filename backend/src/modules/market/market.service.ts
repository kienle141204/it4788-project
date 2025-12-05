import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface Market {
  name: string;
  lat: number;
  lon: number;
  type: string;
  osm_id: string;
  distance?: number; // Distance in km
}

@Injectable()
export class MarketService implements OnModuleInit {
  private markets: Market[] = [];
  private readonly logger = new Logger(MarketService.name);

  onModuleInit() {
    this.loadMarkets();
  }

  private loadMarkets() {
    try {
      const filePath = path.join(process.cwd(), 'src', 'assets', 'danh_sach_cho_vietnam.csv');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Split by newline
      const lines = fileContent.split(/\r?\n/);
      
      // Skip header (line 0)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parsing handling quoted fields
        // Regex to match: "quoted field" or non-comma-sequence
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        // Fallback to simple split if regex fails or for simple lines
        // Actually, let's use a robust split logic or just simple split if we assume no commas in other fields except name
        
        // The file format: Tên Chợ,Vĩ độ (Lat),Kinh độ (Lon),Loại dữ liệu,OSM ID
        // Example: "Chợ Trái Cây, Rau Cải Đất Đỏ",10.4897538,107.2718325,way,410573801
        
        const parts: string[] = [];
        let currentPart = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(currentPart);
            currentPart = '';
          } else {
            currentPart += char;
          }
        }
        parts.push(currentPart);

        if (parts.length >= 3) {
          const name = parts[0].replace(/^"|"$/g, '').trim(); // Remove quotes if present
          const lat = parseFloat(parts[1]);
          const lon = parseFloat(parts[2]);
          const type = parts[3] || '';
          const osm_id = parts[4] || '';

          if (!isNaN(lat) && !isNaN(lon)) {
            this.markets.push({ name, lat, lon, type, osm_id });
          }
        }
      }
      this.logger.log(`Loaded ${this.markets.length} markets from CSV.`);
    } catch (error) {
      this.logger.error('Failed to load market data', error);
    }
  }

  findNearest(lat: number, lon: number, limit: number = 5): Market[] {
    // Calculate distance for all markets
    const marketsWithDistance = this.markets.map(market => {
      return {
        ...market,
        distance: this.haversineDistance(lat, lon, market.lat, market.lon)
      };
    });

    // Sort by distance
    marketsWithDistance.sort((a, b) => a.distance - b.distance);

    // Return top N
    return marketsWithDistance.slice(0, limit);
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
