module.exports = {
    apps: [
        {
            name: 'pdf',
            script: 'npm',
            args: 'start -- -p 3000',
            env: {
                NODE_ENV: 'production',
            },
            output: './logs/out.log',
            error: './logs/error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            merge_logs: true,
            max_memory_restart: '215M',
        },
    ],
};
