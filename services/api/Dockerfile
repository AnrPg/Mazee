# --------------------------------------------
# Builder image: compiles deps and the release
# --------------------------------------------
FROM hexpm/elixir:1.16.2-erlang-26.2.5-debian-bookworm-20240423 AS builder

ENV MIX_ENV=prod LANG=C.UTF-8

# Build tools (Argon2 NIFs) + git
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Elixir build tools
RUN mix local.hex --force && mix local.rebar --force

# 1) deps cache layer
COPY mix.exs mix.lock ./
COPY config config
RUN mix deps.get --only prod && mix deps.compile

# 2) app source
COPY lib lib
# NO "priv" in your repo — so we skip copying it

# Compile & build release
RUN mix compile
RUN mix release

# --------------------------------------------
# Runner image: minimal runtime for the release
# --------------------------------------------
FROM debian:bookworm-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
      openssl ca-certificates postgresql-client curl \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=C.UTF-8 MIX_ENV=prod SHELL=/bin/bash HOME=/home/app

# non-root user
RUN useradd --create-home --home-dir $HOME --shell /bin/bash app
WORKDIR /app
USER app

# copy self-contained release
COPY --from=builder /app/_build/prod/rel/mazee ./mazee

EXPOSE 4000
ENV PHX_SERVER=true PORT=4000

ENTRYPOINT ["./mazee/bin/mazee"]
CMD ["start"]
