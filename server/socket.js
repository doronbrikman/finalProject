(function () {
    'use strict';

    function Socket() {
        var array = [];

        function addSocket(socket) {
            var exist = false;
            for (var i = 0; i < array.length; i++) {
                if (array[i].id === socket.id) {
                    exist = true;
                    break;
                }
            }

            if (!exist) {
                array.push(socket);
            }
        }

        function getSockets() {
            return array;
        }

        return {
            addSocket: addSocket,
            getSockets: getSockets
        }
    }

    module.exports = Socket;
})();