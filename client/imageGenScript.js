
export default {
    data() {
      return {
        description: '',
      };
    },
    methods: {
      async submit() {
        const image = this.$refs.imageInput.files[0];
        const formData = new FormData();
        formData.append('image', image);
  
        try {
          const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
          });
          if (response.ok) {
            this.description = '';
            this.$refs.imageInput.value = '';
            alert('Image tweeted successfully');
          } else {
            throw new Error(await response.text());
          }
        } catch (error) {
          alert(error.message);
        }
      },
    },
  };
