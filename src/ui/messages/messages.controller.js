angular.module('proxtop').controller('MessagesController', ['$scope', 'ipcManager', '$state', 'AvatarService', '$mdDialog', '$mdToast', '$translate', function($scope, ipcManager, $state, avatar, $mdDialog, $mdToast, translate) {
    const DialogController = ['$scope', '$mdDialog', function($scope, $mdDialog) {
        $scope.currentUser = "";
        $scope.participants = [];
        $scope.message = {
            title: null,
            text: ""
        };

        $scope.create = () => {
            $mdDialog.hide({
                participants: $scope.participants,
                title: $scope.message.title,
                text: $scope.message.text
            });
        };

        $scope.cancel = () => {
            $mdDialog.cancel();
        };
    }];
    
    const ipc = ipcManager($scope);
    $scope.conversations = null;
    $scope.hide_nonfavs = false;
    $scope.hover_id = -1;
    ipc.once('conversations', (ev, conversations) => {
        $scope.conversations = conversations;
        ipc.send('conversations-favorites');
    });

    ipc.once('conversations-favorites', (ev, favorites) => {
        const ids = favorites.map((fav) => fav.id);
        $scope.conversations = $scope.conversations.map(function(conv) {
            conv.favorite = ids.includes(conv.id);
            return conv;
        });
    });

    $scope.openConversation = (conversation) => {
        $state.go('message', {
            id: conversation.id
        });
    };

    $scope.newConversation = (ev) => {
        $mdDialog.show({
            controller: DialogController,
            templateUrl: 'ui/messages/message-create.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true
        }).then((answer) => {
            ipc.once('conversation-create', (ev, result) => {
                if(result.error == 0) {
                    $state.go('message', {
                        id: result.cid
                    });
                } else {
                    translate('ERROR.MESSAGE_CREATE_ERROR').then((translation) => {
                        $mdToast.show($mdToast.simple().hideDelay(5000).textContent(translation));
                    });
                }
            });
            ipc.send('conversation-create', answer);
        });
    };

    $scope.toggleFavorite = (conversation, $event) => {
        $event.stopPropagation();
        const prefix = (conversation.favorite ? 'un' : '');
        const event = `conversation-${prefix}favorite`;
        ipc.send(event, conversation.id);
    };

    const toggleFav = (value) => {
        return (ev, result) => {
            for(var i = 0; i < $scope.conversations.length; i++) {
                if($scope.conversations[i].id == result.id) {
                    $scope.conversations[i].favorite = value;
                    return;
                }
            }
        };
    };

    ipc.on('conversation-favorite', toggleFav(true));
    ipc.on('conversation-unfavorite', toggleFav(false));

    $scope.getImage = avatar.getAvatarForID.bind(avatar);

    ipc.send('conversations');
}]);
