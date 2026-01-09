import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface Market {
  name: string;
  lat: number;
  lon: number;
  type: string;
  osm_id: string;
  distance?: number;
}

interface CachedResult {
  markets: Market[];
  timestamp: number;
}

@Injectable()
export class MarketService implements OnModuleInit {
  private markets: Market[] = [];
  private readonly logger = new Logger(MarketService.name);
  private locationCache = new Map<string, CachedResult>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 phút

  onModuleInit() {
    this.loadMarkets();
    // Cleanup cache mỗi 10 phút để tránh memory leak
    setInterval(() => this.cleanupCache(), 10 * 60 * 1000);
  }

  private cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.locationCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.locationCache.delete(key);
      }
    }
  }

  private loadMarkets() {
    try {
      const filePath = path.join(process.cwd(), 'src', 'assets', 'danh_sach_cho_vietnam.csv');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lines = fileContent.split(/\r?\n/);

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

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
          const name = parts[0].replace(/^"|"$/g, '').trim();
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
    // Tạo cache key từ lat/lon (làm tròn đến 3 chữ số thập phân ~100m)
    // Điều này cho phép cache cho các vị trí gần nhau
    const cacheKey = `${Math.round(lat * 1000)},${Math.round(lon * 1000)}`;
    const cached = this.locationCache.get(cacheKey);
    
    // Kiểm tra cache
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.debug(`Cache hit for location ${lat}, ${lon}`);
      return cached.markets.slice(0, limit);
    }

    const radiusKm = 15; // Bán kính cố định 15km
    const cosLat = Math.cos(this.deg2rad(lat));
    
    // STEP 1: Lọc theo bounding box (loại bỏ phần lớn điểm xa)
    const candidates = this.filterByBoundingBox(lat, lon, radiusKm, cosLat);

    // STEP 2: Tính khoảng cách chính xác và lọc theo bán kính tròn
    const marketsWithinRadius: Market[] = [];
    
    for (const market of candidates) {
      const distance = this.haversineDistance(lat, lon, market.lat, market.lon);
      
      // Chỉ lấy các chợ trong bán kính 15km
      if (distance <= radiusKm) {
        marketsWithinRadius.push({
          ...market,
          distance
        });
      }
    }

    // STEP 3: Sort theo khoảng cách
    marketsWithinRadius.sort((a, b) => a.distance! - b.distance!);

    // STEP 4: Trả về top N (hoặc tất cả nếu ít hơn limit)
    const result = marketsWithinRadius.slice(0, limit);
    
    // Lưu vào cache
    this.locationCache.set(cacheKey, {
      markets: result,
      timestamp: Date.now()
    });
    
    this.logger.debug(`Cache miss for location ${lat}, ${lon}, found ${result.length} markets`);
    return result;
  }

  /**
   * Lọc theo bounding box - loại bỏ ~95% điểm xa trong vòng 15km
   */
  private filterByBoundingBox(
    lat: number, 
    lon: number, 
    radiusKm: number,
    cosLat: number
  ): Market[] {
    // 1 degree latitude ≈ 111 km
    const latDelta = radiusKm / 111;
    
    // 1 degree longitude = 111 * cos(latitude) km
    const lonDelta = radiusKm / (111 * cosLat);

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLon = lon - lonDelta;
    const maxLon = lon + lonDelta;

    return this.markets.filter(market => 
      market.lat >= minLat && 
      market.lat <= maxLat &&
      market.lon >= minLon && 
      market.lon <= maxLon
    );
  }

  /**
   * Haversine distance - chỉ dùng cho kết quả cuối cùng
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}