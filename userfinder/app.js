console.log('alhamdulillah');





$(document).ready(() => {
    $('#userSearch').on('keyup', (e) => {
        let un = e.target.value;

        $.ajax({
            url: 'https://api.github.com/users/' + un,

            data: {
                client_id: 'd18957fc25f7390f3ce5',
                client_secret: 'b9c53668c6159f8cdefb618fe8fc9147242432ef'
            }
        }).done((user) => {
            console.log(user);
            $('#name').html(`  <div class="panel panel-defalut">
    <div class="panel-heading">

<h6>
  ${user.name}
  <small class="text-muted">${user.location}</small>
</h6>
  <small class="text-muted">${user.email}</small>

    </div>
    <div class="panel-body">
        <div class="row">
            <div class="col-md-3">
              <img style="width:100%" class="thumbnail" src='${user.avatar_url}'/>
              <a class="btn btn-outline-success" target='_blank' href="${user.html_url}">View Profile</a>
            </div>
            <div class="col-md-9">
              <span class="badge badge-pill badge-primary">Public Repos: ${user.public_repos}</span>
<span class="badge badge-pill badge-secondary">Public Gists: ${user.public_gists}</span>
<span class="badge badge-pill badge-success">Followers: ${user.followers}</span>
<span class="badge badge-pill badge-danger">Followings: ${user.following}</span>



            </div>
        </div>
    </div>`);
        });
    });
});




