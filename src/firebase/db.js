import { db } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { auth } from "./firebase";

export const addUser = async (user) => {
  try {
    await setDoc(doc(db, "users", user.userId), {
      username: user.username,
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Error adding user to Firestore:", error);
    return false;
  }
};

export const getUser = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error("Error getting user from Firestore:", error);
    return null;
  }
};


const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};


export const uploadImage = async (file) => {
  try {
    const base64String = await fileToBase64(file);
    const imageRef = doc(collection(db, "images"));

    await setDoc(imageRef, {
      imageData: base64String,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    });

    return imageRef.id;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};


export const getImage = async (imageId) => {
  try {
    const imageDoc = await getDoc(doc(db, "images", imageId));
    if (!imageDoc.exists()) {
      throw new Error("Image not found");
    }
    return imageDoc.data();
  } catch (error) {
    console.error("Error getting image:", error);
    throw error;
  }
};


export const getImages = async (imageIds) => {
  try {
    const imagePromises = imageIds.map((id) => getImage(id));
    return await Promise.all(imagePromises);
  } catch (error) {
    console.error("Error getting images:", error);
    throw error;
  }
};


export const createArticle = async (articleData) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User must be logged in to create an article");
    }

    
    const articleRef = await addDoc(collection(db, "articles"), {
      title: articleData.title,
      text: articleData.text,
      imageRefs: articleData.imageRefs,
      author: doc(db, "users", currentUser.uid), 
      likesCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    
    
    

    return articleRef.id;
  } catch (error) {
    console.error("Error creating article:", error);
    throw error;
  }
};


export const getArticles = async () => {
  try {
    const articlesSnapshot = await getDocs(collection(db, "articles"));
    const articles = {};

    for (const docRef of articlesSnapshot.docs) {
      const articleData = docRef.data();
      
      const authorDoc = await getDoc(articleData.author);
      const authorData = authorDoc.data();

      
      const imagePromises = articleData.imageRefs.map(async (imageId) => {
        const imageDoc = await getDoc(doc(db, "images", imageId));
        if (!imageDoc.exists()) {
          throw new Error("Image not found");
        }
        return imageDoc.data().imageData; 
      });

      const images = await Promise.all(imagePromises);

      
      const likesSnapshot = await getDocs(
        collection(db, `articles/${docRef.id}/likes`)
      );

      articles[docRef.id] = {
        ...articleData,
        author: authorData?.username || "Unknown",
        imgs: images, 
        likes: likesSnapshot.size,
        date:
          articleData.createdAt?.toDate().toISOString().split("T")[0] ||
          new Date().toISOString().split("T")[0],
      };
    }

    return articles;
  } catch (error) {
    console.error("Error getting articles:", error);
    throw error;
  }
};


export const getArticlesByAuthor = async (authorId) => {
  try {
    const articlesQuery = query(
      collection(db, "articles"),
      where("author", "==", doc(db, "users", authorId))
    );

    const articlesSnapshot = await getDocs(articlesQuery);
    const articles = {};

    for (const docRef of articlesSnapshot.docs) {
      const articleData = docRef.data();

      
      const imagePromises = articleData.imageRefs.map(async (imageId) => {
        const imageDoc = await getDoc(doc(db, "images", imageId));
        if (!imageDoc.exists()) {
          throw new Error("Image not found");
        }
        return imageDoc.data().imageData;
      });

      const images = await Promise.all(imagePromises);

      
      const likesSnapshot = await getDocs(
        collection(db, `articles/${docRef.id}/likes`)
      );

      articles[docRef.id] = {
        ...articleData,
        imgs: images,
        likes: likesSnapshot.size,
        date:
          articleData.createdAt?.toDate().toISOString().split("T")[0] ||
          new Date().toISOString().split("T")[0],
      };
    }

    return articles;
  } catch (error) {
    console.error("Error getting articles by author:", error);
    throw error;
  }
};


export const getArticle = async (articleId) => {
  try {
    const articleDoc = await getDoc(doc(db, "articles", articleId));
    if (!articleDoc.exists()) {
      throw new Error("Article not found");
    }

    const articleData = articleDoc.data();

    
    const authorDoc = await getDoc(articleData.author);
    const authorData = authorDoc.data();

    
    const imagePromises = articleData.imageRefs.map(async (imageId) => {
      const imageDoc = await getDoc(doc(db, "images", imageId));
      if (!imageDoc.exists()) {
        throw new Error("Image not found");
      }
      return imageDoc.data().imageData;
    });

    const images = await Promise.all(imagePromises);

    
    const likesSnapshot = await getDocs(
      collection(db, `articles/${articleId}/likes`)
    );
    const likesCount = likesSnapshot.size;

    
    const commentsSnapshot = await getDocs(
      collection(db, `articles/${articleId}/comments`)
    );
    const comments = [];
    for (const commentDoc of commentsSnapshot.docs) {
      const commentData = commentDoc.data();
      const commentAuthorDoc = await getDoc(commentData.author);
      const commentAuthorData = commentAuthorDoc.data();

      comments.push({
        id: commentDoc.id,
        author: commentAuthorData,
        text: commentData.text,
        createdAt:
          commentData.createdAt?.toDate().toISOString() ||
          new Date().toISOString(),
      });
    }

    return {
      ...articleData,
      id: articleId,
      author: authorData?.username || "Unknown",
      imgs: images,
      likes: likesCount,
      comments: comments,
      date:
        articleData.createdAt?.toDate().toISOString().split("T")[0] ||
        new Date().toISOString().split("T")[0],
    };
  } catch (error) {
    console.error("Error getting article:", error);
    throw error;
  }
};

export async function deleteArticle(articleId) {
  try {
    
    const articleDoc = await getDoc(doc(db, "articles", articleId));
    if (!articleDoc.exists()) {
      throw new Error("Article not found");
    }

    const articleData = articleDoc.data();

    
    const deleteImagePromises = articleData.imageRefs.map((imageId) =>
      deleteImage(imageId)
    );
    await Promise.all(deleteImagePromises);

    
    await deleteDoc(doc(db, "articles", articleId));
    return true;
  } catch (error) {
    console.error("Error deleting article:", error);
    throw error;
  }
}


export const deleteImage = async (imageId) => {
  try {
    await deleteDoc(doc(db, "images", imageId));
    return true;
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};

export async function updateArticle(articleId, articleData) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User must be logged in to update an article");
    }

    
    const articleDoc = await getDoc(doc(db, "articles", articleId));
    if (!articleDoc.exists()) {
      throw new Error("Article not found");
    }

    const article = articleDoc.data();
    const authorRef = article.author;
    const authorDoc = await getDoc(authorRef);

    if (authorDoc.id !== currentUser.uid) {
      throw new Error("You can only update your own articles");
    }

    
    await setDoc(
      doc(db, "articles", articleId),
      {
        ...article,
        title: articleData.title,
        text: articleData.text,
        imageRefs: articleData.imageRefs,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    console.error("Error updating article:", error);
    throw error;
  }
}

export const addComment = async (articleId, text) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User must be logged in to comment");

    const commentRef = doc(collection(db, "articles", articleId, "comments"));
    const commentData = {
      text,
      author: doc(db, "users", user.uid),
      createdAt: serverTimestamp(),
    };

    await setDoc(commentRef, commentData);
    return commentRef.id;
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

export const getComments = async (articleId) => {
  try {
    const commentsRef = collection(db, "articles", articleId, "comments");
    const commentsSnapshot = await getDocs(commentsRef);

    const comments = await Promise.all(
      commentsSnapshot.docs.map(async (doc) => {
        const commentData = doc.data();
        const authorDoc = await getDoc(commentData.author);
        const authorData = authorDoc.data();

        return {
          id: doc.id,
          text: commentData.text,
          createdAt: commentData.createdAt?.toDate(),
          author: {
            id: authorDoc.id,
            username: authorData.username,
          },
        };
      })
    );

    return comments.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error getting comments:", error);
    throw error;
  }
};

export const deleteComment = async (articleId, commentId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User must be logged in to delete comments");

    const commentRef = doc(db, "articles", articleId, "comments", commentId);
    const commentDoc = await getDoc(commentRef);

    if (!commentDoc.exists()) {
      throw new Error("Comment not found");
    }

    const commentData = commentDoc.data();
    const authorDoc = await getDoc(commentData.author);

    if (authorDoc.id !== user.uid) {
      throw new Error("Only the comment author can delete the comment");
    }

    await deleteDoc(commentRef);
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
};

export const listenToComments = (articleId, callback) => {
  const commentsRef = collection(db, "articles", articleId, "comments");
  return onSnapshot(commentsRef, async (snapshot) => {
    const comments = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const commentData = doc.data();
        const authorDoc = await getDoc(commentData.author);
        const authorData = authorDoc.data();

        return {
          id: doc.id,
          text: commentData.text,
          createdAt: commentData.createdAt?.toDate(),
          author: {
            id: authorDoc.id,
            username: authorData.username,
          },
        };
      })
    );

    callback(comments.sort((a, b) => b.createdAt - a.createdAt));
  });
};

export const toggleLike = async (articleId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User must be logged in to like articles");

    const likeRef = doc(db, "articles", articleId, "likes", user.uid);
    const likeDoc = await getDoc(likeRef);

    if (likeDoc.exists()) {
      
      await deleteDoc(likeRef);
    } else {
      
      await setDoc(likeRef, {
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
    }

    
    const likesSnapshot = await getDocs(
      collection(db, `articles/${articleId}/likes`)
    );
    return likesSnapshot.size;
  } catch (error) {
    console.error("Error toggling like:", error);
    throw error;
  }
};

export const checkIfLiked = async (articleId) => {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    const likeRef = doc(db, "articles", articleId, "likes", user.uid);
    const likeDoc = await getDoc(likeRef);
    return likeDoc.exists();
  } catch (error) {
    console.error("Error checking like status:", error);
    return false;
  }
};

export const listenToLikes = (articleId, callback) => {
  const likesRef = collection(db, "articles", articleId, "likes");
  return onSnapshot(likesRef, async (snapshot) => {
    const likesCount = snapshot.size;
    const isLiked = auth.currentUser
      ? snapshot.docs.some((doc) => doc.id === auth.currentUser.uid)
      : false;

    callback({
      count: likesCount,
      isLiked,
    });
  });
};
