# 🍟 Blotato Spam Filter

A high-performance, TypeScript-based spam detection service for Twitter-like social media platforms. Built with advanced content analysis, edge case handling, and comprehensive API endpoints.

## 🚀 Key Features

### 🔍 **Advanced Spam Detection**
- **6 Detection Rules** running in parallel
- **Sub-millisecond processing** (average 0.39ms)
- **Deep content analysis** with character, word, and sentence patterns
- **Edge case handling** for obfuscation, encoding issues, and Unicode variants

### ⚡ **High Performance**
- **In-memory caching** with 30x+ speedup
- **Batch processing** support
- **Performance monitoring** with P95/P99 metrics
- **Automatic optimization recommendations**

### 🛡️ **Production Ready**
- **Complete REST API** with OpenAPI documentation
- **Security middleware** (CORS, Helmet, rate limiting)
- **Input validation** with Zod schemas
- **Health checks** and monitoring endpoints

### 🔷 **Strong TypeScript Foundation**
- **Strict TypeScript** configuration
- **Comprehensive type safety** throughout
- **Layered architecture** with clear separation of concerns

## 📊 Performance Metrics

| Metric | Value | Target |
|--------|-------|--------|
| Average Processing Time | 0.39ms | <50ms ✅ |
| P95 Processing Time | 1.17ms | <100ms ✅ |
| Cache Hit Speedup | 30-43x | >10x ✅ |
| Memory Usage | 16.6MB | <100MB ✅ |
| Detection Rules | 6 active | 6+ ✅ |

## 🏗️ Architecture

```
src/
├── types/              # TypeScript definitions
├── services/           # Core business logic
│   ├── rules/         # Detection rules
│   └── optimizations/ # Performance & edge cases
├── controllers/       # API request handlers
├── routes/           # Express route definitions
├── middleware/       # Security & validation
├── schemas/          # Zod validation schemas
├── cache/            # High-performance caching
├── mocks/            # Test data scenarios
├── test/             # Comprehensive test suites
└── utils/            # Helper utilities
```

## 🔧 Installation & Setup

```bash
# Clone the repository
git clone <repository-url>
cd blotato-spam-filter

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start development server
npm run dev

# Run comprehensive demo
npm run demo
```

## 📡 API Endpoints

### **Analysis Endpoints**
- `POST /api/analyze` - Analyze single post
- `POST /api/analyze/batch` - Analyze multiple posts
- `GET /api/stats` - Get analysis statistics

### **Health & Monitoring**
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system status
- `GET /ready` - Readiness probe
- `GET /live` - Liveness probe

### **Cache Management**
- `POST /api/cache/clear` - Clear detection cache
- `POST /api/cache/cleanup` - Remove expired entries

## 💡 Usage Examples

### Single Post Analysis
```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Get rich quick! Click here now!!!",
    "metadata": {"platform": "twitter"}
  }'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "decision": "reject",
    "overallScore": 0.86,
    "confidence": 0.54,
    "indicators": [
      {
        "type": "promotional",
        "severity": "high",
        "confidence": 1.0,
        "evidence": ["Spam phrase detected: get rich quick"]
      }
    ],
    "processingTime": 0.85
  }
}
```

### Batch Analysis
```bash
curl -X POST http://localhost:3001/api/analyze/batch \
  -H "Content-Type: application/json" \
  -d '{
    "posts": [
      {"content": "Just had coffee!", "metadata": {"platform": "twitter"}},
      {"content": "BUY NOW!!! URGENT!!!", "metadata": {"platform": "twitter"}}
    ]
  }'
```

## 🎯 Detection Rules

| Rule | Weight | Purpose |
|------|--------|---------|
| **Profanity** | 0.30 | Detects abusive language |
| **Promotional** | 0.25 | Identifies spam marketing |
| **Fake Engagement** | 0.25 | Catches follow-for-follow schemes |
| **Suspicious Links** | 0.35 | Flags malicious URLs |
| **Repetitive Content** | 0.20 | Finds spam patterns |
| **Caps Abuse** | 0.15 | Detects excessive capitalization |

## 🔬 Edge Case Handling

- **Unicode normalization** and encoding fixes
- **Obfuscation detection** (l33t speak, zero-width chars)
- **Homograph attack** prevention
- **Extreme length** content handling
- **Special character** pattern analysis
- **Contextual validation** (URLs, mentions, hashtags)

## 🧪 Testing

The project includes comprehensive test suites:

```bash
# Run detection engine tests
npm run test:detection

# Run API integration tests  
npm run test

# Run complete demo with all tests
npm run demo
```

**Test Categories:**
- ✅ Legitimate content recognition
- ✅ Spam content detection
- ✅ Abusive content filtering
- ✅ Edge case handling
- ✅ Performance benchmarking
- ✅ API endpoint validation

## 📈 Monitoring & Health

The service provides detailed monitoring:

- **Performance metrics** (response times, throughput)
- **Cache statistics** (hit rates, memory usage)
- **Error tracking** and health status
- **Optimization recommendations**
- **System resource monitoring**

Access via `/health/detailed` endpoint for complete system status.

## 🛠️ Configuration

Key configuration options in `src/config/detection.ts`:

```typescript
export const DETECTION_THRESHOLDS = {
  allow: 0.2,        // < 20% spam probability
  flag: 0.5,         // 20-50% needs review
  underReview: 0.7,  // 50-70% suspicious  
  reject: 0.7        // > 70% definitive spam
};
```

## 🚀 Deployment

**Supported Platforms:**
- Railway, Render, Fly.io
- DigitalOcean, AWS, GCP
- Docker containers
- Traditional VPS with PM2

**Environment Variables:**
```bash
PORT=3000
NODE_ENV=production
# Add database config when implemented
```

## 🔮 Future Enhancements

- [ ] SQLite persistence integration
- [ ] Machine learning model integration
- [ ] Multi-language support
- [ ] Real-time streaming analysis
- [ ] Admin dashboard UI
- [ ] A/B testing framework

## 📄 License

MIT License - feel free to use in your projects!


---

**Built with ❤️ using TypeScript, Express, and modern Node.js practices.** 