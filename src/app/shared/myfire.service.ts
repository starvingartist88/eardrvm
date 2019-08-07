import * as firebase from 'firebase';
import { Injectable } from '@angular/core';
import { UserService } from './user.service';

@Injectable()
export class MyFireService {

    constructor(private user: UserService){}


    getUserFromDatabase (uid) {

        const ref = firebase.database().ref('users/' + uid);
        return ref.once('value')
            .then(snapshot => snapshot.val());
    }

    generateRandomName(){
        let text = "";
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

        for(let i = 0; i < 5; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text
    }

    uploadFile(file) {
        const fileName = this.generateRandomName();
        const fileRef = firebase.storage().ref().child('image/' + fileName);
        const uploadTask = fileRef.put(file);

        return new Promise((resolve, reject) => {

        uploadTask.on('state_changed', _snapshot => {
        }, error => {
            reject(error);
        }, () => {
            uploadTask.snapshot.ref.getDownloadURL().then(downloadURL=>{
                const fileUrl = downloadURL;
                resolve({fileName, fileUrl});
            })
        });
    });
}


    handleImageUpload(data) {

        const user = this.user.getProfile();

        const newPersonalPostKey = firebase.database().ref().child('myposts').push().key;
        const personalPostDetails = {
            fileUrl: data.fileUrl,
            name: data.fileName,
            creationDate: new Date().toString()
        };

        const allPostsKey = firebase.database().ref('allposts').push().key;
        const allPostsDetails = {
            fileUrl: data.fileUrl,
            name: data.fileName,
            creationDate: new Date().toString(),
            uploadedBy: user
        };

        const imageDetails = {
            fileUrl: data.fileUrl,
            name: data.fileName,
            creationDate: new Date().toString(),
            uploadedBy: user,
            favoriteCount: 0
        };


        
        const updates = {};
        updates['/myposts/' + user.uid + "/" + newPersonalPostKey ] = personalPostDetails;
        updates['/allposts/' + allPostsKey] = allPostsDetails;
        updates['/images/' + data.fileName] = imageDetails;

        return firebase.database().ref().update(updates);
    };

    getUserPostsRef(uid) {
        return firebase.database().ref('myposts').child(uid);
    }

    handleFavoriteClicked(imageData) {

        const uid = firebase.auth().currentUser.uid;

        const updates = {};

        updates['/images/' + imageData.name + "/oldFavoriteCount"] = imageData.favoriteCount;
        updates['/images/' + imageData.name + "/favoriteCount"] = imageData.favoriteCount + 1;
        updates['/favorites/' + uid + "/" + imageData.name] = imageData;

        return firebase.database().ref().update(updates);
    }

    followUser(uploadedByUser) {
        const uid = firebase.auth().currentUser.uid;

        const updates = {};
        updates['/follow/' + uid + "/" + uploadedByUser.uid] = true;

        return firebase.database().ref().update(updates);
    }
}