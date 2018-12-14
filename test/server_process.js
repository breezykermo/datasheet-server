var assert = require('assert');
var child_process = require('child_process')
var http = require('http');
import test from 'ava'

const SERVER_LAUNCH_WAIT_TIME = 10 * 1000;

var server_proc = null;
var server_exited = false;

test.before.cb(t => {
  console.log("launching server...")
  server_proc = child_process.spawn('yarn', ['dev'], {
    cwd: '.',
    stdio: 'ignore'
  });

  server_proc.on('exit', function(code, signal) {
    server_exited = true;
  });

  setTimeout(t.end, SERVER_LAUNCH_WAIT_TIME);
});

test.after(function() {
  console.log("killing server...")
  server_proc.kill('SIGKILL');
});

test('should launch', t => {
  t.false(server_exited);
});

var passUrls = [
  // Express API registered routes: 
  // /
  '/api/',
  // /blueprints
  '/api/blueprints',
  // /update
  '/api/update',
  // /:sheet/:tab/:resource
  '/api/example/export_events/rows',
  // /:sheet/:tab/:resource/:frag
  '/api/example/export_events/rows/1'
];

var failUrls = [
  // /:sheet
  '/api/example',
  // /:sheet/:tab
  '/api/example/events'
]

passUrls.forEach(function(url) {
  test.cb('should respond successfully to request for "' + url + '"', t => {
    http.get({
      hostname: 'localhost',
      port: 4040,
      path: url,
      agent: false
    }, function(res) {
      var result_data = '';

      if(res.statusCode != 200) {
        t.fail('Server response was not 200.');
      } else {
        res.on('data', function(data) { result_data += data });

        res.on('end', function() {
          if (result_data.length > 0) {
            t.pass();
          } else {
            t.fail("Server returned no data.");
          }
        });
      }

      t.end();
    })
  });
});

failUrls.forEach(function(url) {
  test.cb('should fail to respond to request for "' + url + '"', t => {
    http.get({
      hostname: 'localhost',
      port: 4040,
      path: url,
      agent: false
    }, function(res) {
      var result_data = '';

      if(res.statusCode < 400) {
        t.fail('Server response was not erroneous.');
      } else {
        t.pass();
      }

      t.end();
    })
  });
});