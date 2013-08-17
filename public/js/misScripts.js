jQuery(document).ready(function($){
    // Ligar eventos a elementos
    $('.eliminar-elemento').click(function(){
        if(!confirm("Este cambio no se puede deshacer\n¿Está seguro?")){
            return false;
        }
    });
    $(".chosen-select").chosen();
});