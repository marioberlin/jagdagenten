# Database Integration for A2A TypeScript SDK

## Overview

The A2A TypeScript SDK provides production-ready database integration for persistent task storage. Instead of using in-memory storage that loses data on server restart, you can configure your A2A server to use PostgreSQL, MySQL, or SQLite for reliable task persistence.

## Supported Databases

### PostgreSQL
- **Best for**: Production deployments, high concurrency, complex queries
- **Features**:
  - Connection pooling for high-performance concurrent access
  - JSONB support for efficient storage of artifacts and metadata
  - Automatic retry logic for transient failures
  - Comprehensive indexing for fast queries
  - SSL support for secure connections

### MySQL
- **Best for**: Web applications, widespread infrastructure support
- **Features**:
  - Connection pooling with configurable pool size
  - JSON support (MySQL 5.7+)
  - InnoDB engine optimization
  - Automatic retry with exponential backoff
  - SSL/TLS support

### SQLite
- **Best for**: Development, testing, small deployments, edge computing
- **Features**:
  - File-based database (no external dependencies)
  - WAL mode for better concurrency
  - Prepared statements for optimal performance
  - Automatic schema creation
  - Minimal resource footprint

## Quick Start

### PostgreSQL Example

```typescript
import { A2AServer, AgentExecutor } from 'a2a-sdk';
import type { Message, AgentExecutionResult } from 'a2a-sdk';

class MyAgent implements AgentExecutor {
  async execute(message: Message, context: any): Promise<AgentExecutionResult> {
    // Your agent logic here
    return { message: response };
  }
}

const server = new A2AServer({
  agentCard: { /* ... */ },
  executor: new MyAgent(),
  database: {
    type: 'postgres',
    connection: 'postgresql://user:password@localhost:5432/a2a_db',
    maxConnections: 20,
    ssl: false, // Set to true for production
  },
});

await server.start('fastify');
```

### MySQL Example

```typescript
const server = new A2AServer({
  agentCard: { /* ... */ },
  executor: new MyAgent(),
  database: {
    type: 'mysql',
    connection: {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'password',
      database: 'a2a_db',
    },
    maxConnections: 20,
  },
});
```

### SQLite Example

```typescript
const server = new A2AServer({
  agentCard: { /* ... */ },
  executor: new MyAgent(),
  database: {
    type: 'sqlite',
    connection: './a2a-tasks.db',
    walMode: true,
    foreignKeys: true,
  },
});
```

## Database Configuration

### Common Options

All database types support these common configuration options:

```typescript
interface DatabaseConfig {
  /** Database type */
  type: 'postgres' | 'mysql' | 'sqlite';

  /** Connection string or configuration object */
  connection: string | object;

  /** Database table name (default: 'a2a_tasks') */
  tableName?: string;

  /** Connection timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Maximum number of connections in pool (default: 10) */
  maxConnections?: number;

  /** Enable SSL for connections (default: false) */
  ssl?: boolean;
}
```

### PostgreSQL-Specific Options

```typescript
interface PostgresConfig extends DatabaseConfig {
  /** PostgreSQL connection string */
  connection: string;

  /** Enable SSL for connections (default: false) */
  ssl?: boolean;

  /** Connection retry attempts (default: 3) */
  retryAttempts?: number;

  /** Delay between retry attempts in ms (default: 1000) */
  retryDelay?: number;
}
```

### MySQL-Specific Options

```typescript
interface MysqlConfig extends DatabaseConfig {
  /** MySQL connection configuration */
  connection: {
    host: string;
    port?: number;
    user: string;
    password: string;
    database: string;
  };

  /** Connection retry attempts (default: 3) */
  retryAttempts?: number;

  /** Delay between retry attempts in ms (default: 1000) */
  retryDelay?: number;
}
```

### SQLite-Specific Options

```typescript
interface SQLiteConfig extends DatabaseConfig {
  /** Database file path */
  connection: string;

  /** Enable WAL mode for better concurrency (default: true) */
  walMode?: boolean;

  /** Enable foreign key constraints (default: true) */
  foreignKeys?: boolean;

  /** Cache size (default: 2000 pages) */
  cacheSize?: number;
}
```

## Database Schema

### Automatic Table Creation

The SDK automatically creates the required database table on server startup:

```sql
CREATE TABLE a2a_tasks (
  id VARCHAR(255) PRIMARY KEY,
  context_id VARCHAR(255) NOT NULL,
  status_state VARCHAR(100),
  status_message TEXT,
  status_timestamp TIMESTAMPTZ,
  artifacts JSONB DEFAULT '[]'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

The SDK creates indexes for optimal query performance:

```sql
-- PostgreSQL/MySQL
CREATE INDEX idx_a2a_tasks_context_id ON a2a_tasks (context_id);
CREATE INDEX idx_a2a_tasks_status ON a2a_tasks (status_state);
CREATE INDEX idx_a2a_tasks_created_at ON a2a_tasks (created_at);

-- SQLite
CREATE INDEX idx_a2a_tasks_context_id ON a2a_tasks (context_id);
CREATE INDEX idx_a2a_tasks_status ON a2a_tasks (status_state);
CREATE INDEX idx_a2a_tasks_created_at ON a2a_tasks (created_at);
```

## Task Persistence

### How It Works

1. **Task Creation**: When a task is created, it's serialized and stored in the database
2. **Status Updates**: Task status changes are automatically persisted
3. **History Tracking**: Complete task history is maintained
4. **Metadata Storage**: Custom metadata is stored as JSON
5. **Artifacts**: Task artifacts are persisted for later retrieval

### Example Workflow

```typescript
// Server receives a message
const task: Task = {
  id: 'task-123',
  contextId: 'ctx-456',
  status: {
    state: 'running',
    timestamp: new Date().toISOString(),
  },
  artifacts: [],
  history: [message],
  metadata: { user: 'john@example.com' },
};

// Task is automatically persisted to database
await taskStore.createTask(task);

// Status update
task.status.state = 'completed';
await taskStore.updateTask(task.id, task);

// Task can be retrieved later
const retrieved = await taskStore.getTask('task-123');
```

## Production Deployment

### PostgreSQL Production Configuration

```typescript
const server = new A2AServer({
  // ... other config
  database: {
    type: 'postgres',
    connection: 'postgresql://user:password@db.example.com:5432/a2a_prod',
    maxConnections: 50,
    ssl: true, // Always use SSL in production
    retryAttempts: 5,
    retryDelay: 2000,
  },
});
```

### Connection Pool Sizing

Recommended connection pool sizes based on workload:

| Concurrent Users | PostgreSQL Pool | MySQL Pool | Notes |
|-----------------|-----------------|------------|-------|
| 1-100           | 10-20           | 10-20      | Small applications |
| 100-500         | 20-50           | 20-50      | Medium applications |
| 500-1000        | 50-100          | 50-100     | Large applications |
| 1000+           | 100+            | 100+       | Requires load balancing |

### Security Best Practices

1. **Use SSL/TLS**:
   ```typescript
   ssl: true, // PostgreSQL/MySQL
   ```

2. **Environment Variables**:
   ```typescript
   connection: process.env.DATABASE_URL || 'postgresql://...',
   ```

3. **Connection Limits**:
   ```typescript
   maxConnections: 20, // Adjust based on database capacity
   ```

4. **SSL Certificate Verification**:
   ```typescript
   ssl: {
     rejectUnauthorized: true, // Verify SSL certificates
   }
   ```

## Database-Specific Features

### PostgreSQL Features

- **JSONB**: Efficient binary JSON storage
- **Connection Pooling**: Built-in pool management
- **Retry Logic**: Automatic retry with exponential backoff
- **Indexes**: Automatically created for performance

Example query performance:
```sql
-- Fast lookup by context
SELECT * FROM a2a_tasks WHERE context_id = 'ctx-123';

-- Filter by status
SELECT * FROM a2a_tasks WHERE status_state = 'completed';

-- Recent tasks
SELECT * FROM a2a_tasks ORDER BY created_at DESC LIMIT 10;
```

### MySQL Features

- **JSON**: Native JSON support (MySQL 5.7+)
- **InnoDB**: Optimized for concurrent access
- **Connection Pooling**: Efficient resource management
- **Retry Logic**: Handles transient failures

Example query performance:
```sql
-- JSON extraction
SELECT id, JSON_EXTRACT(metadata, '$.user') as user
FROM a2a_tasks;

-- Status filtering
SELECT * FROM a2a_tasks WHERE status_state = 'running';
```

### SQLite Features

- **WAL Mode**: Write-Ahead Logging for better concurrency
- **Prepared Statements**: Pre-compiled for performance
- **File-Based**: No external dependencies
- **Lightweight**: Minimal resource usage

Example operations:
```sql
-- Direct file access
sqlite3 ./a2a-tasks.db

-- Query tasks
SELECT * FROM a2a_tasks WHERE context_id = 'ctx-123';

-- Database info
PRAGMA page_count; -- Check database size
PRAGMA wal_checkpoint; -- Check WAL mode status
```

## Monitoring and Maintenance

### PostgreSQL Monitoring

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Monitor query performance
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table size
SELECT pg_size_pretty(pg_total_relation_size('a2a_tasks'));
```

### MySQL Monitoring

```sql
-- Check active connections
SHOW PROCESSLIST;

-- Monitor slow queries
SHOW VARIABLES LIKE 'slow_query_log';
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;

-- Check table size
SELECT
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'your_database'
  AND table_name = 'a2a_tasks';
```

### SQLite Maintenance

```sql
-- Check database integrity
PRAGMA integrity_check;

-- Analyze query performance
EXPLAIN QUERY PLAN SELECT * FROM a2a_tasks WHERE context_id = '123';

-- Vacuum to reclaim space
VACUUM;

-- Check WAL mode status
PRAGMA journal_mode;
```

## Migration from In-Memory Storage

### Step 1: Configure Database

```typescript
// Before: In-memory storage
const server = new A2AServer({
  agentCard: { /* ... */ },
  executor: new MyAgent(),
  // No database config = in-memory storage
});

// After: Database storage
const server = new A2AServer({
  agentCard: { /* ... */ },
  executor: new MyAgent(),
  database: {
    type: 'postgres',
    connection: 'postgresql://...',
  },
});
```

### Step 2: Update Dependencies

```bash
npm install pg mysql2 better-sqlite3
```

### Step 3: Deploy and Test

1. Start server with database configuration
2. Verify table creation:
   ```bash
   # PostgreSQL
   psql -d a2a_db -c "\d a2a_tasks"

   # MySQL
   mysql -u root -p -e "USE a2a_db; DESCRIBE a2a_tasks;"

   # SQLite
   sqlite3 ./a2a-tasks.db ".schema a2a_tasks"
   ```
3. Test task persistence
4. Monitor logs for any initialization errors

## Troubleshooting

### Connection Issues

**Error**: `ECONNREFUSED`
- Check if database server is running
- Verify connection string/credentials
- Check firewall settings

**Error**: `Authentication failed`
- Verify username/password
- Check database user permissions
- Ensure database exists

### Performance Issues

**Slow queries**:
- Check indexes are created
- Analyze query plans
- Consider increasing connection pool size
- Monitor database resource usage

**Connection pool exhaustion**:
- Increase `maxConnections`
- Check for connection leaks
- Monitor active connections
- Consider load balancing

### Data Issues

**Missing tasks**:
- Check task store implementation
- Verify database connection
- Check task filtering parameters
- Review transaction logs

## Examples

See the `examples/` directory for complete implementations:

- `database-postgres-example.ts` - PostgreSQL with Fastify
- `database-mysql-example.ts` - MySQL with Express
- `database-sqlite-example.ts` - SQLite with Fastify

## API Reference

### TaskStoreFactory

```typescript
import { TaskStoreFactory } from 'a2a-sdk';

const taskStore = TaskStoreFactory.create({
  type: 'postgres',
  connection: 'postgresql://...',
});
```

### DatabaseTaskStore Interface

```typescript
interface DatabaseTaskStore {
  initialize(): Promise<void>;
  createTask(task: Task): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  getTask(id: string): Promise<Task | null>;
  deleteTask(id: string): Promise<void>;
  listTasks(filter?: TaskFilter): Promise<Task[]>;
  close(): Promise<void>;
}
```

## Comparison

| Feature | PostgreSQL | MySQL | SQLite |
|---------|------------|-------|--------|
| Setup Complexity | Medium | Medium | Low |
| Performance | High | High | Medium |
| Scalability | Excellent | Excellent | Limited |
| Concurrency | Excellent | Very Good | Good |
| Disk Usage | Medium | Medium | Low |
| Features | Most | Many | Few |
| Best For | Production | Web Apps | Dev/Edge |

## Further Reading

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [SQLite Documentation](https://sqlite.org/docs.html)
- [Connection Pool Best Practices](https://github.com/coopernurse/node-pool)
- [Database Performance Tuning](https://use-the-index-luke.com/)
