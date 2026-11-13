const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const PROTO_POT = path.join(__dirname, "..", "proto", "polnjenje.proto");

const definicija = protoLoader.loadSync(PROTO_POT, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

module.exports = grpc.loadPackageDefinition(definicija).polnjenje;