# Contributing

Small, focused pull requests are welcome. Explain the user-facing behavior and
include the validation commands you ran.

## Local checks

```bash
npm --prefix server ci
npm --prefix client ci
npm --prefix server run typecheck
npm --prefix server test
npm --prefix server run build
npm --prefix client run build
```

Do not commit `.env` files, database dumps, generated `dist/` output or real
customer data. Keep changes compatible with Node.js 22 and the documented
environment variables.
