<?php
if (isset($_SESSION['email'])) {
    header('Location: dashboard');
    exit();
}
include 'includes/functions.php';
login();
?>

<!DOCTYPE html>
<html lang="id">
<?php include './templates/header.php'; ?>

<body class="d-flex align-items-center justify-content-center min-vh-100">
    <div class="container">
        <div class="row justify-content-center">
            <!-- Gambar di tengah -->
            <div class="col-lg-7 col-md-7 col-sm-12 d-flex justify-content-center">
                <img src="img/test3.png" alt="SINDAPARKA" class="img-fluid" style="width: 100%; max-width: 600px;">
            </div>
            <!-- Form login di sebelah kanan -->
            <div class="col-lg-5 col-md-5 col-sm-12">
                <div class="card o-hidden border-0 shadow-lg my-5">
                    <div class="card-body p-0 py-3">
                        <div class="row">
                            <div class="col-12">
                                <div class="p-5">
                                    <div class="text-center">
                                        <h1 class="h4 text-gray-900 mb-4">Sistem Pakar <br> Diagnosis Stunting</h1>
                                    </div>
                                    <form class="user" method="POST">
                                        <div class="form-group">
                                            <input type="text" class="form-control form-control-user" name="email"
                                            id="email" placeholder="Masukkan email atau no. telepon..." required>
                                        </div>
                                        <div class="form-group">
                                            <div class="input-group input-group.border-0">
                                                <input type="password" class="form-control form-control-user"
                                                name="password" id="password"
                                                placeholder="Masukkan kata sandi..." required>
                                                <div class="input-group-append">
                                                    <button class="btn btn-rounded" type="button" id="show-password-btn"
                                                    data-action='show-password'>
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="btn btn-rounded" type="button" id="hide-password-btn"
                                                data-action='hide-password'>
                                                <i class="fas fa-eye-slash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3 d-flex justify-content-end">
                                    <a href="forgot-password"
                                    class="text-decoration-underline text-muted">Lupa kata sandi?</a>
                                </div>
                                <button type="submit"
                                class="btn btn-primary btn-user btn-block">Masuk</button>
                                <div class="my-2 text-center">
                                    <div class="d-flex justify-content-center align-items-center">
                                        <div class="custom-border flex-grow-1"></div>
                                        <div class="px-2 text-secondary">atau</div>
                                        <div class="custom-border flex-grow-1"></div>
                                    </div>
                                </div>
                                <a href="diagnosis"
                                class="btn btn-primary btn-user btn-block">Masuk sebagai tamu</a>
                                <div class="mt-4 text-center">
                                    <a href="register"
                                    class="text-decoration-none text-muted"><u>Buat akun baru!</u></a>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</div>

<!-- Bootstrap JS and Font Awesome JS -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/js/all.min.js"></script>
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
</body>

<?php include './templates/js.php'; ?>

</html>