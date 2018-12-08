<template>
  <div class="posts">
    <h1>Posts</h1>
    This file will list all the posts.

    <div v-for="aanbieding in aanbiedingen">
      <p>
        <span><b>{{ aanbieding }}</b></span><br />
        <span>{{ aanbieding }}</span>
      </p>
    </div>
  </div>
</template>

<script>
import Aanbiedingen from '@/services/Aanbiedingen'
export default {
  name: 'aanbiedingen',
  data () {
    return {
      posts: []
    }
  },
  mounted () {
    this.getPosts()
  },
  methods: {
    async getPosts () {
      const response = await PostsService.fetchPosts()
      this.posts = response.data
    }
  }
}
</script>