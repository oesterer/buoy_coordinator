ssh buoy-prod \
    "cd /opt/buoy_coordinator && docker compose --env-file deploy/prod.env -f deploy/compose.prod.yml logs --tail=100 -f backend"
